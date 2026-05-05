import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";
import {
  handleAction,
  hasAction
} from "https://unpkg.com/custom-card-helpers@2.0.0/dist/index.m.js?module";

class EmelyaCoffeeCard extends LitElement {
  static properties = {
    hass: {},
    config: {},
    selectedCoffee: { state: true },
    power: { type: Boolean },
    coffeeTypes: { state: true }
  }; 
  DEFAULT_COFFEE_CARD_MOD = {
    // Стили для корневого элемента (.)
    ".": `
      :host {
        border-radius: 24px !important;
      }
      
      ha-card {
        font-size: 16px !important;
        overflow: visible !important;
      } 
      
      ha-card ha-select { 
        --mdc-select-fill-color: rgba(255, 255, 255, 0.10);
        --mdc-theme-surface: #1C1B1F;
        background-color: rgba(255, 255, 255, 0.10) !important;
        border-radius: 16px !important;
        --restore-card-border-radius: 16px !important;
        --ha-card-border-radius: 16px !important;
        box-sizing: border-box !important;
        backdrop-filter: blur(12px) !important;
        z-index: 99 !important;
      }
      ha-card ha-select mwc-list-item{
        z-index: 99 !important;
        position: relative !important;
      }
    `,

    // Стили для ha-select и его внутренних элементов
    "ha-select": {
      "$": `
        .mdc-select {
          border-radius: 16px !important;
          background-color: transparent !important;
        }

        .mdc-select__anchor {
          border-radius: 16px !important;
          background-color: transparent !important;
          align-items: center !important;
        }

        .mdc-select__anchor .mdc-select__selected-text-container .mdc-select__selected-text {
          line-height: 100%;
          display: flex;
          align-items: center;
        }

        .mdc-select__anchor .mdc-line-ripple {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }  

        .mdc-select__anchor .mdc-floating-label {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }  

        .mdc-select__anchor .mdc-select__dropdown-icon {
          width: 8px !important;
          height: 8px !important;
          border-right: 1px solid white !important; 
          border-bottom: 1px solid white !important;
          transform: translateY(-50%) rotate(45deg) !important;
        }   

        .mdc-select__anchor[aria-expanded="true"] .mdc-select__dropdown-icon {
          transform: translateY(0%) rotate(225deg) !important;
        }  

        .mdc-select__dropdown-icon-graphic polyline {
          stroke: white !important;
          stroke-width: 1px !important;
        }  

        .mdc-select__anchor .mdc-select__dropdown-icon svg {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }
      `
    }
  };

  constructor() {
    super();
    this.power = false;
    this.selectedCoffee = "";
    this.coffeeTypes = [];
    this._expectedPower = null;
    this._expectedCoffee = null;
    this._holdTimer = null;
    this._lastTap = 0;
    this._bgPreloaded = false;
  }

  set hass(hass) {
    this._hass = hass;

    const entity = this.config?.entity;
    const stateObj = hass?.states?.[entity];

    if (stateObj) {
      const newPower = stateObj.state === "on";
      if (this._expectedPower !== null) {
        if (newPower === this._expectedPower) {
          this._expectedPower = null;
          this.power = newPower;
        }
      } else {
        this.power = newPower;
      }
    }

    const coffeeEntity = this.config?.coffee_entity;
    const coffeeState = hass?.states?.[coffeeEntity];

    if (coffeeState) {
      this.coffeeTypes = coffeeState.attributes?.options || [];
      const newCoffee = coffeeState.state;

      if (this._expectedCoffee !== null) {
        if (newCoffee === this._expectedCoffee) {
          this._expectedCoffee = null;
          this.selectedCoffee = newCoffee;
        }
      } else {
        this.selectedCoffee = newCoffee || "";
      }
    }
  }

  get hass() {
    return this._hass;
  }

  setConfig(config) {
    this.config = {
      tap_action: { action: "more-info" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" },
      title: "Кофеварка",
      entity: "switch.coffee_machine",
      coffee_entity: "input_select.coffee",
      base_path: "/local",
      card_mod: {
        style: structuredClone(this.DEFAULT_COFFEE_CARD_MOD)
      },
      ...config,
    };

    this.base = this.config.base_path || "/local";

    // Предзагружаем фоновое изображение сразу при установке конфига
    this._preloadBackground();
  }

  // Предзагрузка фона — браузер начинает качать картинку до рендера
  _preloadBackground() {
    const bg = this.config?.background_image
      ? this.config.background_image
      : `${this.base}/images/container-images/coffee_machine.png`;

    if (bg && bg !== this._preloadedBg) {
      this._preloadedBg = bg;
      this._bgPreloaded = false;
      const img = new Image();
      img.onload = () => {
        this._bgPreloaded = true;
        // Добавляем класс bg-loaded на карточку для плавного появления
        const card = this.renderRoot?.querySelector(".card");
        if (card) card.classList.add("bg-loaded");
      };
      img.src = bg;
    }
  }

  // После рендера проверяем — если картинка уже в кэше, сразу показываем
  updated(changedProps) {
    if (changedProps.has("config")) {
      this._preloadBackground();
    }

    const card = this.renderRoot?.querySelector(".card");
    if (!card) return;

    if (this._bgPreloaded) {
      card.classList.add("bg-loaded");
    }
  }

  static styles = css`
    :host {
      display: block;
      max-width: 450px;
      min-width: 320px;
      width: 100%;
      font-family: Roboto, sans-serif;
      color: white;
      border-radius: 24px !important;
      border: none !important;
    }

    ha-card {
      border-radius: 24px !important;
      border: none !important;
      overflow: visible !important;
    }

    .card {
      width: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 16px;
      height: 320px;
      border-radius: 24px;
      color: white;
      cursor: pointer;
      user-select: none;
      position: relative;
      overflow: visible !important;
      /* Базовый фон пока картинка не загружена */
      background: #1C1B1F;
    }
    :host(:has([aria-expanded="true"])) ha-card {
      z-index: 10 !important;
      position: relative !important;
    }

    /*
      Фон вынесен в ::before — убирает background-blend-mode с самого .card.
      background-blend-mode на элементе создаёт stacking context,
      из-за которого position:fixed у дочерних элементов ломается.
      Плавное появление через opacity: 0 → 1 после загрузки.
    */
    .card::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 24px;
      background-image:
        linear-gradient(180deg, rgba(28, 27, 31, 0.00) 70%, #1C1B1F 100%),
        var(--breezer-bg, none),
        linear-gradient(0deg, #1C1B1F, #1C1B1F);
      background-size: auto, 74.782% 76.117%, auto;
      background-position: center, 88px 53.12px, center;
      background-repeat: no-repeat, no-repeat, no-repeat;
      background-blend-mode: normal, luminosity, normal;
      /* Плавное появление — воспринимается быстрее чем резкий pop-in */
      opacity: 0;
      transition: opacity 0.35s ease;
      pointer-events: none;
      z-index: 0;
    }

    .card.bg-loaded::before {
      opacity: 1;
    }

    .card::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 24px;
      padding: 1px;
      background: linear-gradient(291.96deg, #4D4A54 0%, #1C1B1F 50%, #4D4A54 100%) border-box;
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor !important;
      mask-composite: exclude !important;
      pointer-events: none;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 1;
    }

    .title {
      font-size: 16px;
      font-weight: 600;
    }

    .state {
      font-size: 15px;
      opacity: 0.6;
    }

    .controls {
      display: flex;
      gap: 8px;
      align-items: center;
      position: relative;
      z-index: 1;
    }

    .power {
      display: flex;
      width: 56px;
      height: 56px;
      padding: 20px;
      justify-content: center;
      align-items: center;
      gap: 8px;
      aspect-ratio: 1 / 1;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.10);
      box-sizing: border-box;
      position: relative;
      flex-shrink: 0;
      cursor: pointer;
    }

    .power::before {
      content: "" !important;
      position: absolute !important;
      inset: 0 !important;
      padding: 1px !important;
      border-radius: inherit !important;
      background: linear-gradient(
        135deg,
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

    .power.active {
      background: #4D4A54;
    }

    .power img {
      width: 24px;
      height: 24px;
      object-fit: contain;
    }

    ha-select {
      width: 100%;
      position: relative !important;
      background: rgba(255, 255, 255, 0.10) !important;
      border-radius: 16px;
    }

    ha-select::before {
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
  `;

  _stopPropagation(e) {
    e.stopPropagation();
  }

  firstUpdated() {
    const card = this.shadowRoot?.querySelector(".card");
    if (!card) return;

    card.addEventListener("pointerdown", this._onPointerDown.bind(this));
    card.addEventListener("pointerup", this._onPointerUp.bind(this));
    card.addEventListener("click", this._onClick.bind(this));

    // Если картинка уже в кэше — сразу показываем без мигания
    if (this._bgPreloaded) card.classList.add("bg-loaded");
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
  }

  _onPointerDown(e) {
    if (e.target.closest("ha-select") || e.target.closest(".power")) return;

    if (hasAction(this.config, "hold_action")) {
      this._holdTimer = setTimeout(() => {
        this._performAction("hold");
      }, 500);
    }
  }

  _onPointerUp() {
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
  }

  _onClick(e) {
    if (e.target.closest("ha-select") || e.target.closest(".power")) return;

    const now = Date.now();

    if (this._lastTap && now - this._lastTap < 300) {
      if (hasAction(this.config, "double_tap_action")) {
        e.stopImmediatePropagation();
        this._performAction("double_tap");
        this._lastTap = 0;
        return;
      }
    }

    this._lastTap = now;
    setTimeout(() => {
      if (this._lastTap === now) {
        this._performAction("tap");
      }
    }, 320);
  }

  _performAction(actionType) {
    if (!this.hass || !this.config) return;
    handleAction(this, this.hass, this.config, actionType);
  }

  _togglePower(e) {
    e.stopPropagation();

    const entity = this.config?.entity;
    if (!entity || !this.hass) return;

    const newPower = !this.power;
    this.power = newPower;
    this._expectedPower = newPower;

    const domain = entity.split(".")[0];

    if (domain === "switch") {
      this.hass.callService("switch", "toggle", { entity_id: entity });
    } else {
      this.hass.callService("homeassistant", newPower ? "turn_on" : "turn_off", {
        entity_id: entity
      });
    }
  }

  _handleSelectChange(e) {
    e.stopPropagation();

    const value = e.target.value;
    this.selectedCoffee = value;
    this._expectedCoffee = value;

    const coffeeEntity = this.config?.coffee_entity;
    if (!coffeeEntity || !this.hass?.states?.[coffeeEntity]) return;

    const domain = coffeeEntity.split(".")[0];

    if (domain === "input_select") {
      this.hass.callService("input_select", "select_option", {
        entity_id: coffeeEntity,
        option: value
      });
    } else {
      this.hass.callService("select", "select_option", {
        entity_id: coffeeEntity,
        option: value
      });
    }
  }

  _handleSelectDblClick(e) {
    e.stopPropagation();

    if (this.config.coffee_entity) {
      this.dispatchEvent(new CustomEvent("hass-more-info", {
        detail: { entityId: this.config.coffee_entity },
        bubbles: true,
        composed: true
      }));
    }
  }

  render() {
    const bg = this.config.background_image
      ? this.config.background_image
      : `${this.base}/images/container-images/coffee_machine.png`;

    return html`
      <ha-card>
        <div
          class="card"
          style="--coffee-bg: url('${bg}'); border: none; border-radius: 24px !important;"
        >
          <div class="header">
            <div class="title">${this.config?.title || "Кофеварка"}</div>
            <div class="state">${this.power ? "Включено" : "Выключено"}</div>
          </div>

          <div class="controls">
            <div
              class="power ${this.power ? "active" : ""}"
              @pointerdown=${this._stopPropagation}
              @click=${this._togglePower}
            >
              <img src="${this.base}/images/container-images/power_button.png" alt="power">
            </div>

            ${this.hass?.states?.[this.config?.coffee_entity] ? html`
              <ha-select
                .label=${this.hass.states[this.config.coffee_entity].attributes?.friendly_name || "Тип кофе"}
                .value=${this.selectedCoffee}
                @pointerdown=${this._stopPropagation}
                @change=${this._handleSelectChange}
                @dblclick=${this._handleSelectDblClick}
              >
                ${(this.hass.states[this.config.coffee_entity].attributes?.options || []).map(opt => html`
                  <mwc-list-item .value=${opt}>${opt}</mwc-list-item>
                `)}
              </ha-select>
            ` : ""}
          </div>
        </div>
      </ha-card>
    `;
  }

  static getConfigElement() {
    return document.createElement("emelya-coffee-card-editor");
  }

  static getStubConfig() {
    return {
      title: "Кофеварка",
      entity: "switch.coffee_machine",
      coffee_entity: "input_select.coffee",
      base_path: "/local",
      tap_action: { action: "more-info" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" }
    };
  }
}

/* ==================== EDITOR ==================== */
class EmelyaCoffeeCardEditor extends LitElement {
  static properties = {
    hass: {},
    _config: { state: true },
    _tab: { state: true },
    _uploadState: { state: true },
    _uploadError: { state: true },
    _dragOver: { state: true }
  };

  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
    }

    .tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .tab {
      padding: 8px 12px; border-radius: 10px;
      border: 1px solid var(--divider-color);
      background: var(--secondary-background-color);
      cursor: pointer; font-size: 14px;
    }
    .tab.active { background: var(--primary-color); color: white; border-color: var(--primary-color); }

    .img-field { display: flex; flex-direction: column; gap: 12px; }
    .img-label { font-size: 13px; font-weight: 600; color: var(--primary-text-color); }

    .img-preview {
      width: 100%; height: 160px; border-radius: 20px; overflow: hidden;
      background: #1C1B1F; border: 1px solid rgba(101,101,101,0.3);
      display: flex; align-items: center; justify-content: center;
    }
    .img-preview img { width: 120px; height: 120px; object-fit: contain; display: block; }
    .img-preview-empty {
      font-size: 12px; color: var(--secondary-text-color);
      text-align: center; padding: 16px; line-height: 1.5;
    }

    .drop-zone {
      width: 100%; box-sizing: border-box; min-height: 96px;
      border: 2px dashed var(--divider-color); border-radius: 16px;
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 8px; padding: 16px; cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      background: var(--secondary-background-color); text-align: center;
    }
    .drop-zone.dragover {
      border-color: var(--primary-color);
      background: color-mix(in srgb, var(--primary-color) 10%, transparent);
    }
    .drop-zone.loading { opacity: 0.6; pointer-events: none; }

    .drop-icon { font-size: 28px; line-height: 1; }
    .drop-text { font-size: 13px; color: var(--primary-text-color); line-height: 1.4; }
    .drop-sub  { font-size: 11px; color: var(--secondary-text-color); }

    .drop-btn {
      margin-top: 4px; padding: 6px 14px; border-radius: 8px;
      border: 1px solid var(--primary-color); background: transparent;
      color: var(--primary-color); font-size: 13px; cursor: pointer;
      transition: background 0.15s;
    }
    .drop-btn:hover { background: color-mix(in srgb, var(--primary-color) 15%, transparent); }

    .status-row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .status-row.success { color: var(--success-color, #43a047); }
    .status-row.error   { color: var(--error-color, #db4437); }

    .current-path {
      display: flex; align-items: center; gap: 8px; font-size: 12px;
      color: var(--secondary-text-color); background: var(--secondary-background-color);
      border: 1px solid var(--divider-color); border-radius: 10px;
      padding: 8px 10px; box-sizing: border-box;
    }
    .current-path span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .path-clear {
      width: 24px; height: 24px; border: none; border-radius: 6px;
      background: transparent; color: var(--secondary-text-color);
      cursor: pointer; font-size: 14px; display: flex;
      align-items: center; justify-content: center; flex-shrink: 0; transition: color 0.15s;
    }
    .path-clear:hover { color: var(--error-color, #db4437); }

    .img-hint { font-size: 12px; color: var(--secondary-text-color); line-height: 1.6; }
    .img-hint code {
      background: var(--secondary-background-color); border: 1px solid var(--divider-color);
      border-radius: 4px; padding: 1px 5px; font-size: 11px;
    }

    input[type="file"] { display: none; }
  `;

  constructor() {
    super();
    this._tab = 0;
    this._uploadState = "idle"; // idle | loading | success | error
    this._uploadError = "";
    this._dragOver = false;
  }

  setConfig(config) {
    this._config = {
      title: "Кофеварка",
      base_path: "/local",
      entity: "switch.coffee_machine",
      coffee_entity: "input_select.coffee",
      ...config
    };
  }

  render() {
    if (!this._config) return html``;

    return html`
      <div class="tabs">
        ${["Объект", "Внешний вид", "Взаимодействия"].map((t, i) => html`
          <div class="tab ${this._tab === i ? "active" : ""}" @click=${() => this._tab = i}>${t}</div>
        `)}
      </div>

      ${this._tab === 0 ? this._objectTab() : ""}
      ${this._tab === 1 ? this._appearanceTab() : ""}
      ${this._tab === 2 ? this._actionsTab() : ""}
    `;
  }

  _objectTab() {
    return this._form([
      {
        name: "title",
        selector: { text: {} },
        label: "Название"
      },
      {
        name: "entity",
        required: true,
        selector: { entity: { domain: ["switch", "input_boolean"] } },
        label: "Entity"
      },
      {
        name: "coffee_entity",
        required: true,
        selector: { entity: { domain: ["input_select", "select"] } },
        label: "Coffee Entity"
      },
      {
        name: "base_path",
        selector: { text: {} },
        label: "Base Path"
      }
    ]);
  }

  _actionsTab() {
    return this._form([
      {
        name: "tap_action",
        label: this.hass?.localize?.("ui.panel.lovelace.editor.card.generic.tap_action") || "При нажатии",
        selector: { ui_action: {} }
      },
      {
        name: "hold_action",
        label: this.hass?.localize?.("ui.panel.lovelace.editor.card.generic.hold_action") || "При удержании",
        selector: { ui_action: {} }
      },
      {
        name: "double_tap_action",
        label: this.hass?.localize?.("ui.panel.lovelace.editor.card.generic.double_tap_action") || "При двойном нажатии",
        selector: { ui_action: {} }
      }
    ]);
  }

  _appearanceTab() {
    const src = this._config?.background_image;
    return html`
      <div class="img-field">
        <div class="img-label">Фоновое изображение</div>

        <div class="img-preview">
          ${src ? html`
            <img src=${src} alt="preview" @error=${() => { this._uploadState = "error"; this._uploadError = "Файл не найден"; }} />
          ` : html`
            <div class="img-preview-empty">Изображение не задано.<br>Будет использована картинка по умолчанию.</div>
          `}
        </div>

        <div
          class="drop-zone ${this._dragOver ? "dragover" : ""} ${this._uploadState === "loading" ? "loading" : ""}"
          @dragover=${this._onDragOver}
          @dragleave=${this._onDragLeave}
          @drop=${this._onDrop}
          @click=${this._onZoneClick}
        >
          <div class="drop-icon">${this._uploadState === "loading" ? "⏳" : "🖼️"}</div>
          <div class="drop-text">${this._uploadState === "loading" ? "Загрузка..." : "Перетащите изображение сюда"}</div>
          <div class="drop-sub">PNG, JPG, WebP, AVIF, SVG</div>
          ${this._uploadState !== "loading" ? html`
            <button class="drop-btn" @click=${this._onZoneClick}>Выбрать файл</button>
          ` : ""}
        </div>

        <input type="file" id="fileInput" accept="image/*" @change=${this._onFileInput} />

        ${this._uploadState === "success" ? html`<div class="status-row success">✓ Изображение загружено</div>` : ""}
        ${this._uploadState === "error"   ? html`<div class="status-row error">⚠ ${this._uploadError}</div>` : ""}

        ${src ? html`
          <div class="current-path">
            <span title=${src}>${src}</span>
            <button class="path-clear" @click=${this._clearImage}>✕</button>
          </div>
        ` : ""}

        <div class="img-hint">
          Файл сохраняется в <code>config/www/</code> и доступен по пути <code>/local/имя_файла</code>.
          Поддерживаются PNG, JPG, WebP и AVIF.
        </div>
      </div>
    `;
  }

  /* ── Drag & Drop ── */

  _onDragOver(e) { e.preventDefault(); this._dragOver = true; }
  _onDragLeave()  { this._dragOver = false; }

  _onDrop(e) {
    e.preventDefault();
    this._dragOver = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) this._uploadFile(file);
  }

  _onZoneClick(e) {
    e.stopPropagation();
    this.shadowRoot?.getElementById("fileInput")?.click();
  }

  _onFileInput(e) {
    const file = e.target?.files?.[0];
    if (file) this._uploadFile(file);
    e.target.value = "";
  }

  /* ── Нормализация MIME-типа ──
     HA API отклоняет image/avif (и некоторые другие форматы) с HTTP 400.
     Подменяем MIME-тип на image/png перед отправкой — байты файла не трогаем.
     Браузер читает файл по magic bytes, игнорируя Content-Type, поэтому
     avif корректно отобразится после загрузки. */
  _normalizeFileForUpload(file) {
    const unsupportedByHA = ["image/avif", "image/jxl", "image/heic", "image/heif"];
    if (unsupportedByHA.includes(file.type)) {
      return new File([file], file.name, { type: "image/png" });
    }
    return file;
  }

  /* ── Загрузка файла ── */

  async _uploadFile(file) {
    if (!file.type.startsWith("image/")) {
      this._uploadState = "error";
      this._uploadError = "Файл не является изображением";
      return;
    }

    this._uploadState = "loading";
    this._uploadError = "";

    const uploadFile = this._normalizeFileForUpload(file);

    // Attempt 1 — HA store_image
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const resp = await this.hass.fetchWithAuth(
        `/api/config/core/store_image`,
        { method: "POST", body: formData }
      );

      if (resp.ok) {
        const json = await resp.json();
        this._setImage(json.url || `/local/${file.name}`);
        this._uploadState = "success";
        return;
      }
    } catch (_) {}

    // Attempt 2 — /api/image/upload fallback
    try {
      const token = this.hass?.auth?.data?.access_token;
      const formData = new FormData();
      formData.append("file", uploadFile);

      const resp = await fetch(`${window.location.origin}/api/image/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (resp.ok) {
        const json = await resp.json();
        const imgPath = `/api/image/serve/${json.id}/original`;
        this._setImage(imgPath);
        this._uploadState = "success";
        return;
      }

      throw new Error(`HTTP ${resp.status}`);
    } catch (err) {
      this._uploadState = "error";
      this._uploadError = `Не удалось загрузить файл (${err.message}). Поместите файл вручную в config/www/ и укажите путь.`;
    }
  }

  _setImage(path) {
    this._config = { ...this._config, background_image: path };
    this._fire();
  }

  _clearImage() {
    this._uploadState = "idle";
    this._uploadError = "";
    const config = { ...this._config };
    delete config.background_image;
    this._config = config;
    this._fire();
  }

  _form(schema) {
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${schema}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  _valueChanged = (e) => { this._config = e.detail.value; this._fire(); };

  _fire() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    }));
  }
}

/* ==================== REGISTRATION ==================== */
customElements.define("emelya-coffee-card-editor", EmelyaCoffeeCardEditor);
customElements.define("emelya-coffee-card", EmelyaCoffeeCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom:emelya-coffee-card",
  name: "Emelya Coffee Card",
  description: "Управление кофеваркой",
  preview: true
});