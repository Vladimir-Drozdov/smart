import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";

import {
  handleAction,
  hasAction
} from "https://unpkg.com/custom-card-helpers@2.0.0/dist/index.m.js?module";

class EmelyaHumidifierCard extends LitElement {

  static properties = {
    hass: {},
    config: {},
    power: { type: Boolean },
    mode: { state: true },
    modes: { state: true }
  };

  DEFAULT_HUMIDIFIER_CARD_MOD = {
    ".": `
      :host {
        border-radius: 24px !important;
      }
      
      ha-card {
        font-size: 16px !important;
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
        z-index: 3 !important;
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
        }  

        .mdc-select__anchor .mdc-floating-label {
          display: none !important;
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
      `
    }
  };

  constructor(){
    super();
    this.power = false;
    this.mode = "";
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

    if(stateObj){
      const offStates = ["off", "unavailable", "unknown"];
      const newPower = !offStates.includes(stateObj.state);
      if(this._expectedPower !== null){
        if(newPower === this._expectedPower){
          this._expectedPower = null;
          this.power = newPower;
        }
      } else {
        this.power = newPower;
      }
    }

    const modeEntity = this.config?.mode_entity;
    const isSingleEntity = !modeEntity || modeEntity === entity;
    const modeObj = isSingleEntity ? stateObj : hass.states?.[modeEntity];

    if(modeObj){
      const domain = (isSingleEntity ? entity : modeEntity)?.split(".")[0];
      
      // humidifier хранит режимы в available_modes, fan — в preset_modes, select — в options
      const options = modeObj.attributes?.available_modes
        || modeObj.attributes?.preset_modes
        || modeObj.attributes?.options
        || [];
      
      // текущий режим: humidifier/fan — в атрибуте, select — в state
      const newMode = modeObj.attributes?.mode
        ?? modeObj.attributes?.preset_mode
        ?? modeObj.state
        ?? "";

      this.modes = options.length ? options : this.modes;

      if(this._expectedMode !== null){ 
        if(newMode === this._expectedMode){
          this._expectedMode = null;
          this.mode = newMode;
        }
      } else {
        this.mode = newMode || this.mode || (options[0] ?? "");
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
      card_mod: {
        style: structuredClone(this.DEFAULT_HUMIDIFIER_CARD_MOD)
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
      : `${this.base}/images/container-images/humidifier.png`;

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
      max-width:450px; min-width:320px;
      width: 100%; 
      font-family: Roboto; 
      color: white;
      border-radius:24px;
      border:none !important;
    }
    ha-card{
      border-radius:24px !important;
      border:none !important;
    }

    .card{
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
      /* Базовый фон пока картинка не загружена */
      background: #1C1B1F;
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
        linear-gradient(180deg, rgba(28, 27, 31, 0.00) 77.78%, #1C1B1F 100%),
        var(--humidifier-bg, none),
        linear-gradient(0deg, #1C1B1F, #1C1B1F);
      background-size: auto, 141.697% 141.697%, auto;
      background-position: center, -22.849px 67.463px, center;
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
      height:56px;
      position: relative;
      z-index: 3 !important;
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

    .power.active{
      background: #4D4A54;
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

    .power img{
      width:28px;
      height:28px;
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

    // Если картинка уже в кэше — сразу показываем без мигания
    if (this._bgPreloaded) card.classList.add("bg-loaded");
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._holdTimer) clearTimeout(this._holdTimer);
  }

  _onPointerDown(e) {
    if (e.target.closest('ha-select') || e.target.closest('.power')) return;
    if (hasAction(this.config, 'hold_action')) {
      this._holdTimer = setTimeout(() => this._performAction('hold'), 500);
    }
  }

  _onPointerUp() {
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
      if (this._lastTap === now) this._performAction('tap');
    }, 320);
  }

  _performAction(actionType) {
    if (!this.hass || !this.config) return;
    handleAction(this, this.hass, this.config, actionType);
  }

  _togglePower(e){
    e.stopPropagation();
    const entity = this.config?.entity;
    if(!this.hass || !entity) return;

    const newPower = !this.power;
    this.power = newPower;
    this._expectedPower = newPower;

    const domain = entity.split(".")[0];
    const service = newPower ? "turn_on" : "turn_off";

    this.hass.callService(domain, service, { entity_id: entity });
  }

  _handleSelectChange(e){
    e.stopPropagation();
    const value = e.target.value;
    this.mode = value;
    this._expectedMode = value;

    const modeEntity = this.config?.mode_entity;
    if(!this.hass?.states?.[modeEntity]) return;

    const domain = modeEntity.split(".")[0];
    
    const serviceMap = {
      "select": { service: "select_option", param: "option" },
      "input_select": { service: "select_option", param: "option" },
      "fan": { service: "set_preset_mode", param: "preset_mode" },
      "humidifier": { service: "set_mode", param: "mode" }
    };
    
    const mapping = serviceMap[domain];
    
    if(mapping) {
      this.hass.callService(domain, mapping.service, {
        entity_id: modeEntity,
        [mapping.param]: value
      });
    } else if(domain === "number") {
      this.hass.callService("number", "set_value", {
        entity_id: modeEntity,
        value: parseFloat(value)
      });
    } else {
      console.warn(`Unsupported domain for mode_entity: ${domain}`);
    }
  }

  _handleSelectDblClick(e){
    e.stopPropagation();
    if (this.config.mode_entity) {
      this.dispatchEvent(new CustomEvent("hass-more-info", {
        detail: { entityId: this.config.mode_entity },
        bubbles: true,
        composed: true 
      }));
    }
  }

  render(){
    const bg = this.config.background_image 
      ? this.config.background_image 
      : `${this.base}/images/container-images/humidifier.png`;
    const entity     = this._config?.entity;
    const modeEntity = this.config?.mode_entity;
    const isSingleEntity = !modeEntity || modeEntity === entity;
    const modeState = isSingleEntity
      ? this.hass?.states?.[this.config.entity]
      : this.hass?.states?.[modeEntity];

    return html`
    <ha-card>
      <div
        class="card"
        style="--humidifier-bg: url('${bg}'); border: none; border-radius: 24px !important;"
      >
        <div class="header">
          <div class="title">${this.config?.title || "Увлажнитель"}</div>
          <div class="state">
            ${this.power 
              ? (this.config?.label_on || this.config?.mode_labels?.[this.mode] || this.mode || "Включено") 
              : (this.config?.label_off || "Выключено")}

          </div>
        </div>

        <div class="controls">
          <div 
            class="power ${this.power ? "active" : ""}" 
            @pointerdown=${this._stopPropagation}
            @click=${this._togglePower}
          >
            <img src="${this.base}/images/container-images/power_button.png">
          </div>
          
          ${modeState ? html`
            <ha-select
              .label=${modeState.attributes?.friendly_name || "Режим"}
              .value=${this.mode}
              @pointerdown=${this._stopPropagation}
              @change=${this._handleSelectChange}
              @dblclick=${this._handleSelectDblClick}
            >
              ${(modeState.attributes?.available_modes
                || modeState.attributes?.preset_modes
                || modeState.attributes?.options
                || []).map(opt => html`
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

/* ==================== EDITOR ==================== */

class EmelyaHumidifierCardEditor extends LitElement {
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
    .tab.active { 
      background: var(--primary-color); 
      color: white; 
      border-color: var(--primary-color); 
    }

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
      cursor: pointer; font-size: 14px;
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

  setConfig(config) { 
    this._config = { ...config }; 
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
    const modeEntity = this._config?.mode_entity;
    const entity     = this._config?.entity;
    const isSingleEntity = !modeEntity || modeEntity === entity;
    const modeState  = isSingleEntity
      ? this.hass?.states?.[entity]
      : this.hass?.states?.[modeEntity];
    const options = modeState?.attributes?.available_modes
      || modeState?.attributes?.preset_modes
      || modeState?.attributes?.options
      || [];
    const labels     = this._config?.mode_labels || {};

    return html`
      ${this._form([
        { name: "title",       label: "Название",     selector: { text: {} } },
        { name: "label_on",    label: "Статус: вкл",  selector: { text: {} } },
        { name: "label_off",   label: "Статус: выкл", selector: { text: {} } },
        { name: "entity",      required: true,  label: "Сущность питания",  selector: { entity: { domain: ["switch", "fan", "humidifier", "input_boolean"] } } },
        { name: "mode_entity", required: false, label: "Сущность режимов",  selector: { entity: { domain: ["select", "input_select", "fan", "humidifier"] } } },
        { name: "base_path",   selector: { text: {} } }
      ])}

      ${options.length ? html`
        <div class="mode-labels">
          <div class="img-label" style="margin-top:16px;margin-bottom:8px;">
            Названия режимов
          </div>
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
      { name: "tap_action",        label: "При нажатии",         selector: { ui_action: {} } },
      { name: "hold_action",       label: "При удержании",       selector: { ui_action: {} } },
      { name: "double_tap_action", label: "При двойном нажатии", selector: { ui_action: {} } }
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

  /* Drag & Drop */
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

  /* Загрузка файла */
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

  _valueChanged = (e) => { 
    this._config = e.detail.value; 
    this._fire(); 
  };

  _fire() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true, composed: true
    }));
  }
}

/* Регистрация */
EmelyaHumidifierCard.getConfigElement = function () {
  return document.createElement("emelya-humidifier-card-editor");
};

EmelyaHumidifierCard.getStubConfig = function () {
  return {
    entity: "",
    mode_entity: "",
    base_path: "/local"
  };
};

customElements.define("emelya-humidifier-card-editor", EmelyaHumidifierCardEditor);
customElements.define("emelya-humidifier-card", EmelyaHumidifierCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom:emelya-humidifier-card",
  name: "Emelya Humidifier Card",
  description: "Управление увлажнителем",
  preview: true
});