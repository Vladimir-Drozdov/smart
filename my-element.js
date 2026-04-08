import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";  // Матч с hood

/* Основная карточка (без изменений) */
export class MyElement extends LitElement {
  static properties = { hass: {}, config: {} };
  async setConfig(config) {
    this.config = config || {};
    if (!this.config.cards) this.config.cards = [];
    const helpers = await window.loadCardHelpers();
    this._cards = this.config.cards.map(c => helpers.createCardElement(c));
    if (this._hass) {
      this._cards.forEach(c => (c.hass = this._hass));
    }
    this.requestUpdate();
  }
  set hass(hass) {
    this._hass = hass;
    if (this._cards) this._cards.forEach(c => (c.hass = hass));
  }
  get hass() { return this._hass; }
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
      max-width: 976px;
    }
    @container (max-width: 1000px) {
      .container {
        column-count: 2;
        width: 648px;
      }
    }
    @container (max-width: 670px) {
      .container {
        column-count: 1;
        width: 320px;
      }
    }
    .item {
      display: inline-block;
      width: 320px;
      margin-bottom: 8px;
      break-inside: avoid;
      -webkit-column-break-inside: avoid;
      page-break-inside: avoid;
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
    this._onConfigChanged = this._onConfigChanged.bind(this);  // Bind для стабильности
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

export class MyElementEditor extends LitElement {
  static properties = {
    hass: {},
    config: {},
    _editingIndex: { state: true }
  };

  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
    }
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
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
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
    .actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
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
                  <div class="type">${card.type || "unknown"}</div>
                  <div class="sub">${this._cardSummary(card)}</div>
                </div>
                <div class="actions">
                  <ha-button @click=${() => this._moveUp(i)} ?disabled=${i === 0}>↑</ha-button>
                  <ha-button @click=${() => this._moveDown(i)} ?disabled=${i === cards.length - 1}>↓</ha-button>
                  <ha-button @click=${() => this._editCard(i)}>Редактировать</ha-button>
                  <ha-button @click=${() => this._removeCard(i)}>Удалить</ha-button>
                </div>
              </div>
            `)}
            <div class="toolbar">
              <div class="editor-title">Карточки</div>
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

  _update(key, val) {
    this.config = { ...this.config, [key]: val };
    this._fire();
  }

  _editCard(i) {
    this._editingIndex = i;
  }

  _closeEditor = () => {
    this._editingIndex = null;
  };

  _onChildConfigChanged = (e) => {
    e.stopPropagation();

    let newConfig = e.detail.config;

    // Возвращаем card_mod обратно (он был удалён только для редактора)
    if (this._originalCardMod !== undefined) {
      newConfig = { ...newConfig, card_mod: this._originalCardMod };
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

customElements.define("my-element", MyElement);
customElements.define("my-element-editor", MyElementEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom:my-element",
  name: "My Element",
  description: "Container",
  preview: true
});