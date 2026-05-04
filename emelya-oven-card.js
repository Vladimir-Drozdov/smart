import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";

import {
  handleAction,
  hasAction
} from "https://unpkg.com/custom-card-helpers@2.0.0/dist/index.m.js?module";

class EmelyaOvenCard extends LitElement {
  static properties = {
    hass: {},
    config: {},
    power: { type:Boolean },
    temp: { type:Number },
    timer: { type:Number },
    tap_action: {},
    hold_action: {},
    double_tap_action: {},
  };

  constructor(){
    super();
    this.power = false;
    this.temp = 0;
    this.timer = 0;
    this._expectedPower = null;
    this._expectedTemp = null;
    this._expectedTimer = null;
  }

  setConfig(config){
    this.config = config || {};
    this.base = config.base_path || "/local";
  }

  set hass(hass){
    this._hass = hass;

    const powerEntity = this.config.power_entity || this.config.entity;
    const powerStateObj = hass.states?.[powerEntity];
    if(powerStateObj){
      let newPower = false;
      const domain = powerEntity.split(".")[0];
      if(domain === "climate") {
        newPower = powerStateObj.state !== "off";
      } else if(domain === "switch" || domain === "input_boolean" || domain === "fan") {
        newPower = powerStateObj.state === "on";
      } else {
        newPower = powerStateObj.state !== "off";
      }
      if(this._expectedPower !== null){
        if(newPower !== this._expectedPower) return;
        this._expectedPower = null;
      }
      this.power = newPower;
    }

    const tempEntity = this.config.temp_entity || this.config.entity;
    const tempStateObj = hass.states?.[tempEntity];
    if(tempStateObj){
      let newTemp = 0;
      const domain = tempEntity.split(".")[0];
      if(domain === "climate") {
        newTemp = tempStateObj.attributes?.temperature ?? 0;
      } else if(domain === "number" || domain === "input_number" || domain === "sensor") {
        newTemp = Number(tempStateObj.state) || 0;
      }
      this.temp = newTemp;
    }

    const timerEntity = this.config.timer_entity;
    if(timerEntity){
      const timerStateObj = hass.states?.[timerEntity];
      if(timerStateObj) {
        let newTimer = 0;
        const domain = timerEntity.split(".")[0];
        if(domain === "timer") {
          newTimer = Math.round((timerStateObj.attributes?.duration || 0) / 60);
        } else if(domain === "number" || domain === "input_number") {
          newTimer = Number(timerStateObj.state) || 0;
        } else if(domain === "sensor") {
          const value = Number(timerStateObj.state) || 0;
          newTimer = value > 1000 ? Math.round(value / 60) : value;
        }
        this.timer = newTimer;
      }
    }
  }

  get hass(){ return this._hass; }

  static styles = css`
    :host { 
      border-radius: 24px !important;
      border: none !important;
    }
    .card{
      max-width:450px; min-width:320px;
      box-sizing:border-box;
      display:flex;
      flex-direction:column;
      justify-content:space-between;
      padding:16px;
      height:250px;
      border-radius: 24px !important;
      color:white;
    }
    .card::before {
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
    }
    .box{
      flex:1;
      height:52px;
      background: #343239;
      border-radius:16px;
      display:flex;
      width:96px;
      justify-content:center;
      align-items:center;
      gap:4px;
      font-weight:600;
      position: relative;
      background: rgba(255, 255, 255, 0.10);
      backdrop-filter: blur(12px);
    }
    .box::before {
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
    .value{
      min-width:40px;
      font-size:12px;
      text-align:center;
    }
    .power{
      width:80px;
      height:56px;
      background: rgba(255, 255, 255, 0.10);
      border-radius:16px;
      display:flex;
      justify-content:center;
      align-items:center;
      cursor:pointer;
      transition: 0.2s;
      position: relative;
    }
    .power::before {
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
    .power.active{
      background: #4D4A54;
    }
    .power img{
      width:28px;
    }
  `;

  _togglePower(e){
    e.stopPropagation();
    const newPower = !this.power;
    this.power = newPower;

    const entity = this.config.power_entity || this.config.entity;
    if(!this.hass?.states?.[entity]) return;
    this._expectedPower = newPower;

    const domain = entity.split(".")[0];
    if(domain === "climate"){
      this.hass.callService("climate","set_hvac_mode",{
        entity_id: entity,
        hvac_mode: newPower ? "heat" : "off"
      });
    } else if(domain === "switch" || domain === "input_boolean" || domain === "fan"){
      this.hass.callService("homeassistant", newPower ? "turn_on":"turn_off", {
        entity_id: entity
      });
    } else {
      console.warn("Неизвестный домен для power:", domain);
    }
  }

  firstUpdated() {
    const card = this.renderRoot.querySelector(".card");
    if (!card) return;
    card.addEventListener("pointerdown", this._onDown.bind(this));
    card.addEventListener("pointerup", this._onUp.bind(this));
    card.addEventListener("click", this._onClick.bind(this));
  }

  _fireMoreInfo(entityId){
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId },
      bubbles: true,
      composed: true
    }));
  }

  _handleCardClick(e){
    if(e.target.closest("div.box")) return;
    const entity = this.config.entity || this.config.power_entity;
    if(entity) this._fireMoreInfo(entity);
  }

  _handleTempClick(e){
    e.stopPropagation();
    if(this.config.temp_entity){
      this._fireMoreInfo(this.config.temp_entity);
    } else if(this.config.entity){ 
      this._fireMoreInfo(this.config.entity);
    }
  }

  _onDown(e) {
    if (e.target.closest(".box") || e.target.closest(".power")) return;
    if (hasAction(this.config, "hold_action")) {
      this._holdTimer = setTimeout(() => {
        this._runAction("hold");
      }, 500);
    }
  }

  _onUp() {
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
  }

  _onClick(e) {
    if (e.target.closest(".box") || e.target.closest(".power")) return;
    const now = Date.now();
    if (this._lastTap && now - this._lastTap < 300) {
      if (hasAction(this.config, "double_tap_action")) {
        this._runAction("double_tap");
        this._lastTap = 0;
        return;
      }
    }
    this._lastTap = now;
    setTimeout(() => {
      if (this._lastTap === now) {
        this._runAction("tap");
      }
    }, 320);
  }

  _runAction(type) {
    if (!this.hass || !this.config) return;
    handleAction(this, this.hass, this.config, type);
  }

  _handleTimerClick(e){
    e.stopPropagation();
    if(this.config.timer_entity) this._fireMoreInfo(this.config.timer_entity);
  }

  render(){
    const bg = this.config.background_image
      ? this.config.background_image
      : `${this.base}/images/container-images/oven.png`;

    return html`
      <div class="card" @click=${this._handleCardClick}
        style='
          background: linear-gradient(180deg, rgba(28, 27, 31, 0.00) 77.78%, #1C1B1F 100%), url("${bg}") 46.046px -49.611px / 100% 128% no-repeat, var(--Background-Surface-2, #1C1B1F);
          background-blend-mode: normal, luminosity, normal;
          border: none;
          border-radius: 24px !important;
        '>
        <div class="header">
          <div class="title">Духовой шкаф</div>
          <div class="state">${this.power ? "Включено":"Выключено"}</div>
        </div>
        <div class="controls">
          <div class="box" @click=${this._handleTempClick}>
            <div class="value">${this.temp} °C</div>
          </div>
          <div class="box" @click=${this._handleTimerClick}>
            <div class="value">${this.timer} мин</div>
          </div>
          <div class="power ${this.power?"active":""}" @click=${this._togglePower}>
            <img src="${this.base}/images/container-images/power_button.png">
          </div>
        </div>
      </div>
    `;
  }
}

/* EDITOR */

class EmelyaOvenCardEditor extends LitElement {
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

    .tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .tab {
      padding: 8px 12px;
      border-radius: 10px;
      border: 1px solid var(--divider-color);
      background: var(--secondary-background-color);
      cursor: pointer;
      user-select: none;
      font-size: 14px;
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
    this._uploadState = "idle";
    this._uploadError = "";
    this._dragOver = false;
    this._config = {};
  }

  setConfig(config) {
    this._config = {
      tap_action: { action: "more-info" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" },
      ...config
    };
  }

  render() {
    if (!this._config) return html``;

    return html`
      <div class="tabs">
        ${["Сущности", "Внешний вид", "Взаимодействия"].map((title, index) => html`
          <div
            class="tab ${this._tab === index ? "active" : ""}"
            @click=${() => this._tab = index}
          >
            ${title}
          </div>
        `)}
      </div>

      ${this._tab === 0 ? this._entitiesTab() : ""}
      ${this._tab === 1 ? this._appearanceTab() : ""}
      ${this._tab === 2 ? this._actionsTab() : ""}
    `;
  }

  _entitiesTab() {
    return this._form([
      {
        name: "entity",
        label: "Основная сущность духовки",
        selector: { entity: { domain: ["climate"] } }
      },
      {
        name: "power_entity",
        label: "Сущность питания",
        selector: { entity: { domain: ["switch", "input_boolean", "fan", "climate"] } }
      },
      {
        name: "temp_entity",
        label: "Сущность температуры",
        selector: { entity: { domain: ["climate", "number", "input_number", "sensor"] } }
      },
      {
        name: "timer_entity",
        label: "Сущность таймера",
        selector: { entity: { domain: ["timer", "number", "input_number", "sensor"] } }
      },
      {
        name: "base_path",
        label: "Базовый путь к ресурсам",
        selector: { text: {} }
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
            <img src=${src} alt="preview"
              @error=${() => { this._uploadState = "error"; this._uploadError = "Файл не найден"; }}
            />
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
          <div class="drop-sub">PNG, JPG, WebP, SVG</div>
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
        </div>
      </div>
    `;
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

  /* ── Загрузка файла ── */

  async _uploadFile(file) {
    if (!file.type.startsWith("image/")) {
      this._uploadState = "error";
      this._uploadError = "Файл не является изображением";
      return;
    }

    this._uploadState = "loading";
    this._uploadError = "";

    try {
      const formData = new FormData();
      formData.append("file", file);

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

    // Fallback
    try {
      const token = this.hass?.auth?.data?.access_token;
      const formData = new FormData();
      formData.append("file", file);

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

  _valueChanged = (e) => {
    this._config = e.detail.value;
    this._fire();
  };

  _fire() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    }));
  }
}

/* REGISTRATION */

EmelyaOvenCard.getConfigElement = function () {
  return document.createElement("emelya-oven-card-editor");
};

EmelyaOvenCard.getStubConfig = function () {
  return {
    entity: "",
    power_entity: "",
    temp_entity: "",
    timer_entity: "",
    base_path: "/local"
  };
};

if (!customElements.get("emelya-oven-card-editor")) {
  customElements.define("emelya-oven-card-editor", EmelyaOvenCardEditor);
}

if (!customElements.get("emelya-oven-card")) {
  customElements.define("emelya-oven-card", EmelyaOvenCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom:emelya-oven-card",
  name: "Emelya Oven Card",
  description: "Управление духовым шкафом",
  preview: true
});


/* 
# вариант 1: классическая climate духовка
type: custom:emelya-oven-card
entity: climate.oven
timer_entity: number.oven_timer

# вариант 2: кастомная ESPHome духовка
type: custom:emelya-oven-card
power_entity: switch.oven
temp_entity: number.oven_temp
timer_entity: number.oven_timer
*/