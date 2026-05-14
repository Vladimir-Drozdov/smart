import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";

import {
  handleAction,
  hasAction
} from "https://unpkg.com/custom-card-helpers@2.0.0/dist/index.m.js?module";

class EmelyaBreezerCard extends LitElement {

  static properties = {
    hass: {},
    config: {},
    power: { type: Boolean },
    selectedMode: { state: true },
    modes: { state: true }
  };

  DEFAULT_BREEZER_CARD_MOD = {
    ".": `
      ha-card {
        font-size: 16px !important;
        border-radius: 24px !important;
      }
      
      :host {
        border-radius: 24px !important;
        border-color: transparent !important;
        --ha-card-border-color: transparent !important;
        --divider-color: transparent !important;
      }
      
      ha-card ha-select {
        border-radius: 16px !important;
        --restore-card-border-radius: 16px !important;
        --ha-card-border-radius: 16px !important;
        box-sizing: border-box !important;
        backdrop-filter: blur(12px) !important;
        z-index: 2 !important;
      }
      ha-card ha-select mwc-list-item{
        z-index: 2 !important;
        position: relative !important;
      }
    `,

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

  constructor(){
    super();
    this.power = false;
    this.selectedMode = "";
    this.modes = [];
    this._expectedPower = null;
    this._expectedMode = null;
    this._holdTimer = null;
    this._lastTap = 0;
    this._bgPreloaded = false;
  }

  set hass(hass){
    this._hass = hass;

    const entity = this.config?.entity;
    const stateObj = hass.states?.[entity];

    if (!stateObj) return;

    // POWER
    const powerEntity = this.config?.power_entity || entity;
    const powerStateObj = hass.states?.[powerEntity] || stateObj;
    const offStates = ["off", "unavailable", "unknown"];
    const newPower = !offStates.includes(powerStateObj.state);

    if (this._expectedPower !== null) {
      if (newPower === this._expectedPower) {
        this._expectedPower = null;
        this.power = newPower;
      }
    } else {
      this.power = newPower;
    }

    // MODE — определяем источник режимов
    const modeEntity = this.config?.mode_entity;
    const isSingleEntity = !modeEntity || modeEntity === entity;
    const modeStateObj = isSingleEntity
      ? stateObj
      : (hass.states?.[modeEntity] ?? null);

    if (modeStateObj) {
      // fan хранит режимы в preset_modes, select/input_select — в options
      this.modes = modeStateObj.attributes?.preset_modes
        || modeStateObj.attributes?.options
        || [];
      // fan хранит текущий режим в preset_mode, select — в state
      const rawMode = modeStateObj.attributes?.preset_mode ?? "";
      // берём state только для select/input_select (не для fan в off)
      const currentMode = (rawMode && this.modes.includes(rawMode))
        ? rawMode
        : (!isSingleEntity && this.modes.includes(modeStateObj.state)
            ? modeStateObj.state
            : "");

      if (this._expectedMode !== null) {
        if (currentMode === this._expectedMode) {
          this._expectedMode = null;
          this.selectedMode = currentMode;
        }
      } else {
        // currentMode || сохранённый || первый из списка — никогда не пустой
        this.selectedMode = currentMode || this.selectedMode || (this.modes[0] ?? "");
      }
    }
  }

  get hass(){
    return this._hass;
  }

  setConfig(config){
    this.config = {
      tap_action: { action: "more-info" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" },
      title: "Бризер",
      label_on: "Включено",
      label_off: "Выключено",
      card_mod: {
        style: structuredClone(this.DEFAULT_BREEZER_CARD_MOD)
      },
      ...config,
    };

    this.base = this.config.base_path || "/local";
    this._preloadBackground();
  }

  _preloadBackground() {
    const bg = this.config?.background_image
      ? this.config.background_image
      : `${this.base}/images/container-images/breezer.png`;

    if (bg && bg !== this._preloadedBg) {
      this._preloadedBg = bg;
      this._bgPreloaded = false;
      const img = new Image();
      img.onload = () => {
        this._bgPreloaded = true;
        const card = this.renderRoot?.querySelector(".card");
        if (card) card.classList.add("bg-loaded");
      };
      img.src = bg;
    }
  }

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
      max-width:450px; 
      min-width:320px; 
      width: 100%; 
      font-family: Roboto; 
      color: white; 
      border-radius: 24px !important;
      border: none !important;
    }
    ha-card{
      border-radius: 24px !important;
      border: none !important;
    }

    .card {
      width:100%;
      box-sizing:border-box;
      display:flex;
      flex-direction:column;
      justify-content:space-between;
      padding:16px;
      height:320px;
      border-radius:24px;
      color:white;
      cursor: pointer;
      user-select: none;
      position: relative;
      background: #1C1B1F;
    }

    .card::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 24px;
      background-image:
        linear-gradient(180deg, rgba(28, 27, 31, 0.00) 74.79%, #1C1B1F 100%),
        var(--breezer-bg, none),
        linear-gradient(0deg, #1C1B1F, #1C1B1F);
      background-size: auto, 70.472% 98.523%, auto;
      background-position: center, 105.316px 49.164px, center;
      background-repeat: no-repeat, no-repeat, no-repeat;
      background-blend-mode: normal, luminosity, normal;
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

    .header{ 
      display:flex; 
      justify-content:space-between; 
      align-items:center;
      position: relative;
    }
    .title{ 
      font-size:16px; 
      font-weight:600; 
    }
    .state{ 
      font-size:15px; 
      opacity:0.6; 
    }
    .controls{ 
      display:flex; 
      gap:8px; 
      align-items:center;
      position: relative;
      z-index: 2 !important;
    }

    .power{
      display: flex;
      width: 56px;
      height: 56px;
      padding: 20px;
      justify-content: center;
      align-items: center;
      gap: 8px;
      aspect-ratio: 1/1;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.10);
      box-sizing: border-box;
      position: relative;
    }
      
    .power::before {
      content: "" !important;
      position: absolute !important;
      inset: 0 !important;
      padding: 1px !important;
      border-radius: inherit !important;
      background: linear-gradient(135deg, rgba(101, 101, 101, 0) 0%, #656565 50%, rgba(101, 101, 101, 0) 100%) !important;
      pointer-events: none !important;
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor !important;
      mask-composite: exclude !important;
    }

    .power.active{ 
      background: #4D4A54;
    }

    ha-select{
      width:100%;
      position: relative !important;
      background: rgba(255, 255, 255, 0.10) !important;
    }

    ha-select::before {
      content: "" !important;
      position: absolute !important;
      inset: 0 !important;
      padding: 1px !important;
      border-radius: inherit !important;
      background: linear-gradient(165deg, rgba(101, 101, 101, 0) 0%, #656565 50%, rgba(101, 101, 101, 0) 100%) !important;
      pointer-events: none !important;
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor !important;
      mask-composite: exclude !important;
    }
  `;

  _stopPropagation(e){
    e.stopPropagation();
  }

  firstUpdated() {
    const card = this.shadowRoot?.querySelector(".card");
    if (!card) return;

    card.addEventListener("pointerdown", this._onPointerDown.bind(this));
    card.addEventListener("pointerup", this._onPointerUp.bind(this));
    card.addEventListener("click", this._onClick.bind(this));

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
    if (e.target.closest('ha-select') || e.target.closest('.power')) return;

    if (hasAction(this.config, 'hold_action')) {
      this._holdTimer = setTimeout(() => {
        this._performAction('hold');
      }, 500);
    }
  }

  _onPointerUp(e) {
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
  }

  _onClick(e) {
    if (e.target.closest('ha-select') || e.target.closest('.power')) return;

    const now = Date.now();

    if (this._lastTap && now - this._lastTap < 300) {
      if (hasAction(this.config, 'double_tap_action')) {
        e.stopImmediatePropagation();
        this._performAction('double_tap');
        this._lastTap = 0;
        return;
      }
    }

    this._lastTap = now;

    setTimeout(() => {
      if (this._lastTap === now) {
        this._performAction('tap');
      }
    }, 320);
  }

  _performAction(actionType) {
    if (!this.hass || !this.config) return;
    handleAction(this, this.hass, this.config, actionType);
  }

  _togglePower(e){
    e.stopPropagation();
    const entity = this.config?.entity;
    const powerEntity = this.config?.power_entity || entity;
    if (!powerEntity || !this.hass) return;

    const newPower = !this.power;
    this.power = newPower;
    this._expectedPower = newPower;

    const powerDomain = powerEntity.split(".")[0];
    const readOnlyDomains = ["sensor", "binary_sensor"];
    if (readOnlyDomains.includes(powerDomain)) {
      console.warn("emelya-breezer: power entity is read-only:", powerEntity);
      return;
    }

    const service = newPower ? "turn_on" : "turn_off";
    this.hass.callService(powerDomain, service, { entity_id: powerEntity });
  }

  _handleSelectChange(e){
    e.stopPropagation();
    const value = e.target.value;
    if (!value) return;

    this.selectedMode = value;
    this._expectedMode = value;

    const entity = this.config?.entity;
    const modeEntity = this.config?.mode_entity;
    const stateObj = this.hass?.states?.[entity];

    if (!stateObj) return;

    const isSingleEntity = !modeEntity || modeEntity === entity;
    const targetEntity = isSingleEntity ? entity : modeEntity;

    if (isSingleEntity && stateObj.attributes?.preset_modes) {
      this.hass.callService("fan", "set_preset_mode", {
        entity_id: targetEntity,
        preset_mode: value
      });
    } else {
      const domain = targetEntity.split(".")[0];
      this.hass.callService(domain, "select_option", {
        entity_id: targetEntity,
        option: value
      });
    }
  }

  _handleSelectDblClick(e){
    e.stopPropagation();
    const entityForInfo = this.config?.mode_entity || this.config?.entity;
    if (entityForInfo) {
      this.dispatchEvent(new CustomEvent("hass-more-info", {
        detail: { entityId: entityForInfo },
        bubbles: true,
        composed: true
      }));
    }
  }

  render(){
    const entity = this.config?.entity;
    const modeEntity = this.config?.mode_entity;
    const stateObj = this.hass?.states?.[entity];

    // Определяем источник режимов — та же логика что и в set hass
    const isSingleEntity = !modeEntity || modeEntity === entity;
    const modeStateObj = isSingleEntity
      ? stateObj
      : (this.hass?.states?.[modeEntity] ?? null);

    // Режимы: fan → preset_modes, select → options
    const modeOptions = modeStateObj?.attributes?.preset_modes
      || modeStateObj?.attributes?.options
      || [];

    const bg = this.config.background_image
      ? this.config.background_image
      : `${this.base}/images/container-images/breezer.png`;

    // Статус в шапке: если выкл — label_off; если вкл и label_on, то label_on; если вкл и без label_on и есть режим — показываем режим
    const stateLabel = this.power
      ? (this.config?.label_on || this.config?.mode_labels?.[this.selectedMode] || this.selectedMode || "Включено")
      : (this.config?.label_off || "Выключено");

    return html`
    <ha-card>
      <div
        class="card"
        style="--breezer-bg: url('${bg}'); border: none; border-radius: 24px !important;"
      >

        <div class="header">
          <div class="title">${this.config?.title || "Бризер"}</div>
          <div class="state">${stateLabel}</div>
        </div>

        <div class="controls">
          <div 
            class="power ${this.power ? "active" : ""}"
            @pointerdown=${this._stopPropagation}
            @click=${this._togglePower}
          >
            <img src="${this.base}/images/container-images/power_button.png">
          </div>

          ${modeOptions.length ? html`
            <ha-select
              .label=${"Режим"}
              .value=${this.selectedMode}
              @pointerdown=${this._stopPropagation}
              @change=${this._handleSelectChange}
              @dblclick=${this._handleSelectDblClick}
            >
              ${modeOptions.map(opt => html`
                <mwc-list-item .value=${opt}>${this.config?.mode_labels?.[opt] || opt}</mwc-list-item>
              `)}
            </ha-select>
          ` : ""}
        </div>

      </div>
    </ha-card>
    `;
  }
}

/* EDITOR */

class EmelyaBreezerCardEditor extends LitElement {
  static properties = {
    hass: {},
    _config: { state: true },
    _tab: { state: true },
    _uploadState: { state: true },
    _uploadError: { state: true },
    _dragOver: { state: true }
  };

  static styles = css`
    :host { display: block; box-sizing: border-box; }

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

    input[type="file"] { display: none; }
    .mode-labels { display: flex; flex-direction: column; }

    .mode-label-row {
      display: flex; align-items: center; gap: 8px; margin-bottom: 8px;
    }
    .mode-key {
      min-width: 110px; font-size: 13px; color: var(--secondary-text-color);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .mode-label-row input {
      flex: 1; padding: 6px 10px; border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: var(--secondary-background-color);
      color: var(--primary-text-color); font-size: 13px;
      outline: none; box-sizing: border-box;
    }
    .mode-label-row input:focus {
      border-color: var(--primary-color);
    }
  `;

  constructor() {
    super();
    this._tab = 0;
    this._uploadState = "idle";
    this._uploadError = "";
    this._dragOver = false;
  }

  setConfig(config) { this._config = { ...config }; }

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
    const entity = this._config?.entity;
    const modeEntity = this._config?.mode_entity;

    // Собираем режимы из обеих сущностей — что найдём, то и показываем
    const modeState = this.hass?.states?.[modeEntity];
    const fanState  = this.hass?.states?.[entity];

    const options = modeState?.attributes?.options
      || fanState?.attributes?.preset_modes
      || fanState?.attributes?.options
      || [];

    const labels = this._config?.mode_labels || {};

    return html`
      ${this._form([
        { name: "title",       label: "Название",     selector: { text: {} } },
        { name: "label_on",    label: "Статус: вкл",  selector: { text: {} } },
        { name: "label_off",   label: "Статус: выкл", selector: { text: {} } },
        { 
          name: "entity",      
          required: true, 
          selector: { entity: { domain: ["fan", "switch"] } } 
        },
        { 
          name: "mode_entity", 
          required: false, 
          selector: { 
            entity: { 
              domain: ["fan", "switch", "select", "input_select"]
            } 
          }
        },
        {
          name: "power_entity",
          required: false,
          selector: {
            entity: {
              domain: ["switch", "input_boolean", "binary_sensor"]
            }
          }
        },
        { 
          name: "base_path",
          selector: { text: {} } 
        }
      ])}

      ${options.length ? html`
        <div class="mode-labels" style="margin-top: 20px;">
          <div class="img-label">Названия режимов</div>
          ${options.map(opt => html`
            <div class="mode-label-row">
              <span class="mode-key">${opt}</span>
              <input
                type="text"
                placeholder="${opt}"
                .value=${labels[opt] || ""}
                @input=${(e) => this._updateModeLabel(opt, e.target.value)}
              />
            </div>
          `)}
        </div>
      ` : ""}
    `;
  }

  _updateModeLabel(key, value) {
    const labels = { ...(this._config?.mode_labels || {}) };
    if (value.trim()) {
      labels[key] = value.trim();
    } else {
      delete labels[key];
    }
    this._config = {
      ...this._config,
      mode_labels: Object.keys(labels).length ? labels : undefined
    };
    this._fire();
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

  _normalizeFileForUpload(file) {
    const unsupportedByHA = ["image/avif", "image/jxl", "image/heic", "image/heif"];
    if (unsupportedByHA.includes(file.type)) {
      return new File([file], file.name, { type: "image/png" });
    }
    return file;
  }

  async _uploadFile(file) {
    if (!file.type.startsWith("image/")) {
      this._uploadState = "error";
      this._uploadError = "Файл не является изображением";
      return;
    }

    this._uploadState = "loading";
    this._uploadError = "";

    const uploadFile = this._normalizeFileForUpload(file);

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
      this._uploadError = `Не удалось загрузить файл (${err.message}).`;
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

/* Регистрация */
EmelyaBreezerCard.getConfigElement = function () {
  return document.createElement("emelya-breezer-card-editor");
};

EmelyaBreezerCard.getStubConfig = function () {
  return {
    title: "Бризер",
    label_on: "",
    label_off: "Выключено",
    entity: "",
    mode_entity: "",
    base_path: "/local",
  };
};

customElements.define("emelya-breezer-card-editor", EmelyaBreezerCardEditor);
customElements.define("emelya-breezer-card", EmelyaBreezerCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom:emelya-breezer-card",
  name: "Emelya Breezer Card",
  description: "Управление бризером",
  preview: true
});