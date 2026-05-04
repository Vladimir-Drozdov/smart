//import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";
//import { LitElement, html, css } from "https://esm.run/lit@3";
import { LitElement, html, css } from "https://unpkg.com/lit@3/index.js?module";
class MyElement extends LitElement {
  static properties = {
    hass: {},
    config: {},
    _cards: { state: true },
    lovelace: {},
    _editingIndex: { state: true }
  };
  #token = 0;
  async _createCard(cardConfig, helpers) {
    const type = cardConfig.type || '';
    
    // Для кастомных карточек — ждём регистрации
    if (type.startsWith('custom:')) {
      const tagName = type.replace('custom:', '');
      if (!customElements.get(tagName)) {
        try {
          await Promise.race([
            customElements.whenDefined(tagName),
            new Promise(r => setTimeout(r, 5000)) // таймаут 5 сек
          ]);
        } catch(e) {
          // ignore
        }
      }
    }
    
    try {
      return helpers.createCardElement(cardConfig);
    } catch(e) {
      console.warn('my-element: failed to create', cardConfig.type, e);
      const div = document.createElement('div');
      div.style.cssText = 'padding:8px;color:orange;font-size:12px;background:#1c1b1f;border-radius:12px';
      div.textContent = `⚠ ${cardConfig.type}`;
      return div;
    }
  }
  async setConfig(config) {
    this.config = structuredClone(config || {});
    if (!this.config.cards) this.config.cards = [];

    const token = ++this.#token;
    const helpers = await window.loadCardHelpers();
    if (token !== this.#token) return;

    this._cards = await Promise.all(
      this.config.cards.map(c => this._createCard(c, helpers))
    );

    // Точка 1: сразу после создания (до DOM)
    this._spreadHass();

    // Точка 2: после того как Lit вставил карточки в DOM
    await this.updateComplete;
    if (token !== this.#token) return;
    this._spreadHass();
    // ЖДЁМ пока ВСЕ карточки дорендерятся
    await Promise.all(
      this._cards.map(c => c.updateComplete?.catch(() => {}))
    );

    // форсим перерисовку контейнера
    this.requestUpdate();
    await this.updateComplete;
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    this._spreadHass();
    this.requestUpdate();
    // Точка 3: следующий кадр — для карточек с отложенной инициализацией
    requestAnimationFrame(() => {
      if (token !== this.#token) return;
      this._spreadHass();
    });
  }

  _spreadHass() {
    if (this._hass && this._cards) {
      this._cards.forEach(c => (c.hass = this._hass));
    }
  }

  set hass(hass) {
    this._hass = hass;
    this._spreadHass(); // карточки уже существуют — раздаём сразу
  }
  get hass() { return this._hass; }

  // Страховка: после каждого рендера (например смена _cards)
  updated() {
    this._spreadHass();
  }


  static styles = css`
    .wrapper {
      display: flex;
      justify-content: flex-start;
      container-type: inline-size;
      width: 100%;
    }
    .container {
      column-width: 320px;
      column-gap: 8px;
      column-count: 3;
      width: 100%;
      max-width: calc(370px * 3 + 8px); 
      min-width:976px;
    }
    @container (max-width: 1000px) {
      .container {
        column-count: 2;
        width: 100%;
        max-width: calc(370px * 2 + 8px); 
        min-width:648px;
      }
    }
    @container (max-width: 670px) {
      .container {
        column-count: 1;
        width: 100%;
        max-width: 370px;
        min-width: 320px;
      }
    }
    .item {
      display: block;
      max-width:370px; min-width:320px;
      margin-bottom: 8px;
      break-inside: avoid;
      min-height: 1px; 
      -webkit-column-break-inside: avoid;
      page-break-inside: avoid;
      position: relative;
      border-radius: 24px;
      padding: 1px;
      box-sizing: border-box;
      overflow: visible;
    }
  `;

  render() {
    if (!this._cards) return html``;
    return html`
      <div class="wrapper">
        <div class="container">
          ${this._cards.map(card => html`
            <div class="item">${card}</div>
          `)}
        </div>
      </div>
    `;
  }

  static async getConfigElement() {
    return document.createElement("my-element-editor");
  }
  static getStubConfig() {
    return { cards: [] };
  }
}

/* Хост вложенного редактора (attach first + await render) */
class ChildEditorHost extends LitElement {
  static properties = {
    hass: {},
    cardConfig: {},
    _error: {}
  };
  static styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
      pointer-events: auto;  /* Явно для вложенных */
    }
    .editor-shell {
      margin-top: 12px;
      padding: 16px;
      border: 1px solid var(--divider-color);
      border-radius: 16px;
      background: var(--card-background-color, var(--ha-card-background));
      box-sizing: border-box;
      pointer-events: auto;
    }
    #mount {
      pointer-events: auto;
    }
    .error {
      color: var(--error-color);
      line-height: 1.5;
    }
    .hint {
      color: var(--secondary-text-color);
      font-size: 14px;
      line-height: 1.4;
    }
  `;
  constructor() {
    super();
    this._error = "";
    this._editorEl = null;
    this._buildToken = 0;
    this._lastType = null;
    this._preservedCardMod = undefined;
    this._onConfigChanged = this._onConfigChanged.bind(this);
  }
  render() {
    return html`
      <div class="editor-shell">
        <div id="mount"></div>
        ${this._error ? html`<div class="error">${this._error}</div>` : ""}
      </div>
    `;
  }
  async updated(changedProps) {
    if (changedProps.has("cardConfig")) {
      await this._handleConfigChange();
    }
    if (changedProps.has("hass") && this._editorEl) {
      this._editorEl.hass = this.hass;
      if (this._editorEl.updateComplete) await this._editorEl.updateComplete;
    }
  }
  async _handleConfigChange() {
    const newType = this.cardConfig?.type;
    if (newType !== this._lastType || !this._editorEl) {
      this._lastType = newType;
      await this._buildEditor();
    } else if (this._editorEl) {
      // Update существующего: config + await render
      const newConfig = structuredClone(this.cardConfig);
      if (typeof this._editorEl.setConfig === "function") {
        this._editorEl.setConfig(newConfig);
      } else {
        this._editorEl.config = newConfig;
      }
      await this._editorEl.updateComplete;
    }
  }
  async _buildEditor() {
    const mount = this.renderRoot?.querySelector("#mount");
    if (!mount) return;

    const token = ++this._buildToken;
    this._error = "";

    if (this._editorEl) {
      this._editorEl.removeEventListener("config-changed", this._onConfigChanged);
    }
    this._editorEl = null;
    mount.replaceChildren();

    if (!this.cardConfig?.type) {
      this._error = "У карточки отсутствует type";
      return;
    }

    try {
      const helpers = await window.loadCardHelpers();
      if (token !== this._buildToken) return;

      const cardType = this.cardConfig.type;

      let editor = null;

      if (cardType.startsWith("custom:")) {
        // Кастомные карточки
        const cardEl = await helpers.createCardElement(structuredClone(this.cardConfig));
        if (token !== this._buildToken) return;
        const ctor = cardEl.constructor;
        if (typeof ctor?.getConfigElement === "function") {
          editor = await ctor.getConfigElement();
        }
      } else {
        // Нативные карточки (tile, thermostat и т.д.)
        const coreCardClassName = `hui-${cardType}-card`;
        const ctor = customElements.get(coreCardClassName);
        if (ctor && typeof ctor.getConfigElement === "function") {
          editor = await ctor.getConfigElement();
        }
      }

      if (!editor) {
        const hint = document.createElement("div");
        hint.className = "hint";
        hint.textContent = "У этой карточки нет визуального редактора";
        mount.replaceChildren(hint);
        return;
      }

      if (token !== this._buildToken) return;

      // САНИТАЙЗИНГ — убираем card_mod перед открытием редактора ===
      const editorConfig = structuredClone(this.cardConfig);
      const originalCardMod = editorConfig.card_mod;   // сохраняем для возврата
      delete editorConfig.card_mod;                    // убираем, чтобы редактор не падал

      // КРИТИЧЕСКИЙ ПОРЯДОК
      editor.addEventListener("config-changed", this._onConfigChanged);
      mount.replaceChildren(editor);
      this._editorEl = editor;

      editor.hass = this.hass;

      if (typeof editor.setConfig === "function") {
        editor.setConfig(editorConfig);   // передаём ЧИСТЫЙ конфиг
      } else {
        editor.config = editorConfig;
      }

      await editor.updateComplete;

      // Сохраняем оригинальный card_mod в редакторе (чтобы вернуть при сохранении)
      this._originalCardMod = originalCardMod;

    } catch (err) {
      if (token !== this._buildToken) return;
      this._error = err?.message || String(err);
    }
  }
  _onConfigChanged(e) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent("child-config-changed", {
      detail: { config: e.detail.config },
      bubbles: true,
      composed: true
    }));
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._buildToken++;
    if (this._editorEl) {
      this._editorEl.removeEventListener("config-changed", this._onConfigChanged);
    }
  }
}

customElements.define("child-editor-host", ChildEditorHost);

class MyElementEditor extends LitElement {
  static properties = {
    hass: {},
    config: {},
    _editingIndex: { state: true }
  };
  coverTileCardMod = {
    ".": `
      :host {
        border-radius: 24px !important;
        --ha-card-border-radius: 24px !important;
        border-color: transparent !important;
        --ha-card-border-color: transparent !important;
        --divider-color: transparent !important;
      }

      ha-card {
        background-color: #1C1B1F !important;
        height: 132px !important;
        box-sizing: border-box !important;
        --tile-color: transparent !important;
        padding: 16px !important;
      }

      ha-card::before {
        content: "" !important;
        position: absolute !important;
        inset: 0 !important;
        padding: 1px !important;
        border-radius: inherit !important;
        background: linear-gradient(
          165deg,
          rgba(101, 101, 101, 0) 0%,
          #656565 50%,
          rgba(101, 101, 101, 0) 100%
        ) !important;
        pointer-events: none !important;
        -webkit-mask:
          linear-gradient(#fff 0 0) content-box,
          linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor !important;
        mask-composite: exclude !important;
      }

      ha-card hui-card-features {
        padding-right: 0 !important;
        padding-left: 0 !important;
      }

      ha-tile-icon {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }

      ha-tile-info {
        display: flex !important;
        flex-direction: row !important;
        justify-content: space-between !important;
        width: 100% !important;
        flex-wrap: nowrap !important;
      }

      ha-tile-info span:nth-child(2) {
        text-align: right !important;
        color: rgba(255, 255, 255, 0.50) !important;
        opacity: 1 !important;
        font-size: 15px !important;
        font-style: normal !important;
        font-weight: 400 !important;
        line-height: 20px !important;
      }

      ha-tile-info span:nth-child(1) {
        font-family: Roboto !important;
        font-size: 16px !important;
        font-style: normal !important;
        font-weight: 600 !important;
        line-height: 20px !important;
      }
    `,

    "ha-tile-container": {
      "$": `
        .content {
          padding-top: 0 !important;
          padding-right: 0 !important;
          padding-left: 0 !important;
          align-items: start !important;
          flex-grow: 0 !important;
          flex-shrink: 0 !important;
          flex-basis: 0% !important;
          flex: 0 0 0% !important;
          height: 50% !important;
        }

        .container {
          justify-content: space-between !important;
        }
      `,

      "ha-tile-info $": `
        .info {
          flex-direction: row !important;
          justify-content: space-between !important;
          align-items: center !important;
        }
      `,

      "hui-card-features $": {
        "hui-card-feature $": {
          "hui-cover-open-close-card-feature $": {
            "ha-control-button-group": {
              "ha-control-button": {
                "$": `
                  .button::before {
                    content: none !important;
                    background-color: transparent !important;
                    transition: none !important;
                    opacity: 0 !important;
                  }

                  .button ha-ripple {
                    --md-ripple-hover-color: transparent !important;
                    --md-ripple-pressed-color: transparent !important;
                  }
                `
              },

              ".": `
                ha-control-button {
                  background-color: #343239 !important;
                  position: relative !important;
                }

                ha-control-button:nth-child(2)::after, 
                ha-control-button:nth-child(3)::after{
                  content: "" !important;
                  position: absolute !important;
                  inset: 0 !important;
                  padding: 1px !important;
                  border-radius: inherit !important;
                  background: linear-gradient(
                    165deg,
                    rgba(101, 101, 101, 0) 0%,
                    #656565 50%,
                    rgba(101, 101, 101, 0) 100%
                  ) !important;
                  pointer-events: none !important;
                  -webkit-mask:
                    linear-gradient(#fff 0 0) content-box,
                    linear-gradient(#fff 0 0);
                  -webkit-mask-composite: xor !important;
                  mask-composite: exclude !important;
                }
                ha-control-button:nth-child(4)::after{
                  content: "" !important;
                  position: absolute !important;
                  inset: 0 !important;
                  padding: 1px !important;
                  border-radius: inherit !important;
                  background: linear-gradient(
                    15deg,
                    rgba(101, 101, 101, 0) 0%,
                    #656565 50%,
                    rgba(101, 101, 101, 0) 100%
                  ) !important;
                  pointer-events: none !important;
                  -webkit-mask:
                    linear-gradient(#fff 0 0) content-box,
                    linear-gradient(#fff 0 0);
                  -webkit-mask-composite: xor !important;
                  mask-composite: exclude !important;
                }

                ha-control-button[disabled] {
                  background-color: #4D4A54 !important;
                }

                ha-control-button:nth-child(2)::before {
                  content: "";
                  position: absolute !important;
                  top: 50% !important;
                  left: 50% !important;
                  width: 6px !important;
                  height: 6px !important;
                  border-right: 2px solid white !important;
                  border-bottom: 2px solid white !important;
                  transform: translate(-50%, -50%) rotate(45deg) !important;
                }

                ha-control-button:nth-child(4)::before {
                  content: "";
                  position: absolute !important;
                  top: 50% !important;
                  left: 50% !important;
                  width: 6px !important;
                  height: 6px !important;
                  border-right: 2px solid white !important;
                  border-bottom: 2px solid white !important;
                  transform: translate(-50%, 0%) rotate(-135deg) !important;
                }

                ha-control-button:nth-child(even) {
                  display: flex !important;
                  height: 56px !important;
                  padding: 20px !important;
                  justify-content: center !important;
                  align-items: center !important;
                  gap: 8px !important;
                  flex: 1 0 0 !important;
                  border-radius: 16px !important;
                  box-sizing: border-box !important;
                }

                ha-control-button:nth-child(3) {
                  display: flex !important;
                  width: 56px !important;
                  height: 56px !important;
                  padding: 20px !important;
                  justify-content: center !important;
                  align-items: center !important;
                  gap: 8px !important;
                  flex-grow: 0 !important;
                  flex-basis: 56px !important;
                  border-radius: 96px !important;
                  background: #343239 !important;
                  box-sizing: border-box !important;
                }

                ha-control-button:nth-child(3)::before {
                  content: "";
                  position: absolute !important;
                  top: 50% !important;
                  left: 50% !important;
                  width: 12px !important;
                  height: 12px !important;
                  background: white !important;
                  border-radius: 1px !important;
                  transform: translate(-50%, -50%) !important;
                }

                ha-control-button ha-svg-icon {
                  display: none !important;
                  opacity: 0 !important;
                  visibility: hidden !important;
                }
              `
            }
          }
        }
      }
    }
  };

  static styles = css`
    :host { display: block; box-sizing: border-box; }

    .root {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .cards {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 14px;
      border: 1px solid var(--divider-color);
      border-radius: 14px;
      background: var(--secondary-background-color);
    }
    .row-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .type {
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .sub {
      color: var(--secondary-text-color);
      font-size: 13px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Компактные иконки вместо длинных кнопок */
    .actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }
    .actions ha-icon-button {
      --mdc-icon-button-size: 36px;
      color: var(--secondary-text-color);
    }
    .actions ha-icon-button:hover {
      color: var(--primary-text-color);
    }

    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 8px;
    }
    .editor-title {
      font-weight: 600;
      font-size: 15px;
    }
    .back {
      align-self: flex-start;
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 8px;
    }

    .toolbar ha-button {
      --mdc-theme-primary: var(--primary-color);
    }
  `;

  constructor() {
    super();
    this._editingIndex = null;
    this._originalCardMod = undefined;
  }

  setConfig(config) {
    this.config = {
      title: "",
      show_header: false,
      cards: [],
      ...config
    };
  }

  render() {
    if (!this.config) return html``;
    const cards = this.config.cards || [];

    return html`
      <div class="root">
        ${this._editingIndex === null ? html`
          <div class="cards">
            ${cards.map((card, i) => html`
              <div class="row">
                <div class="row-info">
                  <div class="type" title="${card.type || 'unknown'}">
                    ${card.type || "unknown"}
                  </div>
                  <div class="sub" title="${this._cardSummary(card)}">
                    ${this._cardSummary(card)}
                  </div>
                </div>

                <div class="actions">
                  <ha-icon-button 
                    @click=${() => this._moveUp(i)}
                    ?disabled=${i === 0}
                    title="Вверх">
                    ↑
                  </ha-icon-button>
                  <ha-icon-button 
                    @click=${() => this._moveDown(i)}
                    ?disabled=${i === cards.length - 1}
                    title="Вниз">
                    ↓
                  </ha-icon-button>
                  <ha-icon-button 
                    @click=${() => this._editCard(i)}
                    title="Редактировать">
                    <ha-icon icon="mdi:pencil"></ha-icon>
                  </ha-icon-button>
                  <ha-icon-button 
                    @click=${() => this._removeCard(i)}
                    title="Удалить">
                    <ha-icon icon="mdi:delete"></ha-icon>
                  </ha-icon-button>
                </div>
              </div>
            `)}
            <div class="toolbar">
              <div class="editor-title">Карточки</div>
              
              <ha-button raised @click=${this._addCard}>
                <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                Добавить карточку
              </ha-button>
            </div>
          </div>
        ` : html`
          <ha-button class="back" @click=${this._closeEditor}>⬅ Назад</ha-button>
          <div class="editor-title">
            Редактирование: ${cards[this._editingIndex]?.type || "unknown"}
          </div>
          <child-editor-host
            .hass=${this.hass}
            .cardConfig=${cards[this._editingIndex]}
            @child-config-changed=${this._onChildConfigChanged}
          ></child-editor-host>
        `}
      </div>
    `;
  }

  _cardSummary(card) {
    if (!card) return "";
    if (card.entity) return `entity: ${card.entity}`;
    if (card.entities?.length) return `entities: ${card.entities.length}`;
    return "Без дополнительного описания";
  }

  _editCard(i) { this._editingIndex = i; }
  _closeEditor = () => { this._editingIndex = null; };

  _onChildConfigChanged = (e) => {
    e.stopPropagation();

    let newConfig = e.detail.config || {};

    // Надёжное сохранение card_mod даже после редактирования
    const currentCard = this.config.cards?.[this._editingIndex];
    
    if (currentCard?.card_mod) {
      // Если card_mod уже был — сохраняем его поверх
      newConfig = { ...newConfig, card_mod: structuredClone(currentCard.card_mod) };
    } else if (newConfig.card_mod) {
      // Если редактор сам вернул card_mod — оставляем как есть
    }

    const cards = [...(this.config.cards || [])];
    cards[this._editingIndex] = newConfig;

    this.config = { ...this.config, cards };
    this._fire();
  };

  _removeCard(i) {
    const cards = [...(this.config.cards || [])];
    cards.splice(i, 1);
    this.config = { ...this.config, cards };
    this._editingIndex = null;
    this._fire();
  }

  _addCard = () => {
    const popularCards = [
      { label: "Emelya Media Columns",     type: "custom:emelya-media-columns",    config: { base_path: "/local" } },
      { label: "Emelya Coffee Card",       type: "custom:emelya-coffee-card",      config: { base_path: "/local" } },
      { label: "Emelya Kettle", type: "custom:emelya-kettle", config: { base_path: "/local" } },
      { label: "Emelya Humidifier",        type: "custom:emelya-humidifier-card",  config: { base_path: "/local" } },
      { label: "Emelya Oven",              type: "custom:emelya-oven-card",        config: { base_path: "/local" } },
      { label: "Emelya Light Panel",       type: "custom:emelya-light-panel-hui",  config: {} },
      { label: "Emelya Lamp",       type: "custom:emelya-lamp-card",  config: { base_path: "/local"} },
      { label: "Emelya Vacuum Cleaner",    type: "custom:emelya-vacuum-cleaner",   config: { base_path: "/local"} },
      { label: "Emelya Hood",              type: "custom:emelya-hood-card",        config: { base_path: "/local" } },
      { label: "Emelya Dishwasher",        type: "custom:emelya-dishwasher",       config: { base_path: "/local" } },
      { label: "Emelya Washer",            type: "custom:emelya-washer-card",       config: { base_path: "/local" } },
      { label: "Emelya Dryer",            type: "custom:emelya-dryer-card",       config: { base_path: "/local" } },
      { label: "Emelya Breezer",            type: "custom:emelya-breezer-card",       config: { base_path: "/local" } },
      { label: "Dual Thermostat",          type: "custom:dual-thermostat-card",    config: {} },

      {
        label: "Tile: Шторы (Cover Open-Close)",
        type: "tile",
        config: {
          type: "tile",
          entity: "cover.hall_window",
          name: "Шторы",
          features: [
            { type: "cover-open-close" }
          ],
          card_mod: {
            style: structuredClone(this.coverTileCardMod)
          }
        }
      },

      { label: "Tile Card (пустая)",       type: "tile",                         config: { entity: "" } },
      { label: "Entities Card",            type: "entities",                     config: { entities: [] } },
      { label: "Другая карточка вручную",  type: "other",                       config: {} },
    ];

    const dialog = document.createElement("ha-dialog");
    dialog.heading = "Добавить карточку";
    dialog.open = true;
    dialog.style.setProperty("--mdc-dialog-min-width", "420px");

    const content = document.createElement("div");
    content.style.cssText = "padding: 20px 28px 12px;";

    // Используем обычный HTML select — он гораздо стабильнее внутри ha-dialog
    const select = document.createElement("select");
    select.style.cssText = `
      width: 100%;
      padding: 12px 16px;
      font-size: 16px;
      border-radius: 8px;
      background: var(--card-background-color, #1e1e1e);
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color);
    `;

    popularCards.forEach((item, i) => {
      const option = document.createElement("option");
      option.value = i.toString();
      option.textContent = item.label;
      select.appendChild(option);
    });

    content.appendChild(select);
    dialog.appendChild(content);

    const cancelBtn = document.createElement("ha-button");
    cancelBtn.slot = "secondaryAction";
    cancelBtn.textContent = "Отмена";

    const addBtn = document.createElement("ha-button");
    addBtn.slot = "primaryAction";
    addBtn.textContent = "Добавить";

    dialog.appendChild(cancelBtn);
    dialog.appendChild(addBtn);
    document.body.appendChild(dialog);

    // Логика добавления
    addBtn.addEventListener("click", () => {
      const index = parseInt(select.value);
      if (isNaN(index)) return;

      const chosen = popularCards[index];
      let newCard = { type: chosen.type };

      if (chosen.config) {
        newCard = { ...chosen.config, type: chosen.type };
      }

      if (chosen.type === "other") {
        const manualType = prompt("Введите type карточки (например: custom:my-super-card):");
        if (!manualType) return;
        newCard = { type: manualType };
      }

      const cards = [...(this.config.cards || [])];
      cards.push(newCard);

      this.config = { ...this.config, cards };
      this._fire();

      dialog.close();
      dialog.remove();

      // this._editCard(cards.length - 1);   // если надо сразу редактировать
    });

    cancelBtn.addEventListener("click", () => {
      dialog.close();
      dialog.remove();
    });

    // Закрытие по клику вне
    dialog.addEventListener("closed", () => {
      dialog.remove();
    }, { once: true });
  };




  _moveUp(i) {
    if (i <= 0) return;
    const cards = [...this.config.cards];
    [cards[i - 1], cards[i]] = [cards[i], cards[i - 1]];
    this.config = { ...this.config, cards };
    this._fire();
  }

  _moveDown(i) {
    const cards = [...this.config.cards];
    if (i >= cards.length - 1) return;
    [cards[i], cards[i + 1]] = [cards[i + 1], cards[i]];
    this.config = { ...this.config, cards };
    this._fire();
  }

  _fire() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this.config },
      bubbles: true,
      composed: true
    }));
  }
}


//customElements.define("my-element", MyElement);
if (!customElements.get("my-element")) {
  customElements.define("my-element", MyElement);
}
customElements.define("my-element-editor", MyElementEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom:my-element",
  name: "My Element",
  description: "Container",
  preview: true
});
