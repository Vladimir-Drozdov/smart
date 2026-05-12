import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";

import {
  handleAction,
  hasAction
} from "https://unpkg.com/custom-card-helpers@2.0.0/dist/index.m.js?module";

class EmelyaVacuumCleaner extends LitElement {

  static properties = {
    hass: {}, 
    config: {},
    selectedMode: { state: true },
    cleaning: { state: true },
    battery: { state: true }
  };

  DEFAULT_VACUUM_CARD_MOD = {
    ".": `
      :host {
        border-radius: 24px !important;
        border: none !important;
      }
      
      ha-card {
        font-size: 16px !important;
        border-radius: 24px !important;
        border: none !important;
      }
      
      ha-card ha-select { 
        --mdc-select-fill-color: rgba(255, 255, 255, 0.10);
        --mdc-theme-surface: #1C1B1F;
        background-color: rgba(255, 255, 255, 0.10) !important;
        border-radius: 16px !important;
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
    this.selectedMode = "";
    this.cleaning = false;
    this.battery = null;
    this._expectedCleaning = null;
    this._expectedFan = null;
    this._holdTimer = null;
    this._lastTap = 0;
    this._bgPreloaded = false;
  }

  set hass(hass){
    this._hass = hass;
    const entity = this.config?.entity;
    const stateObj = hass.states?.[entity];
    if(!stateObj) return;

    // CLEANING STATE
    const newCleaning = stateObj.state === "cleaning";

    if(this._expectedCleaning !== null){
      if(newCleaning === this._expectedCleaning){
        this._expectedCleaning = null;
        this.cleaning = newCleaning;
      }
    } else {
      this.cleaning = newCleaning;
    }

    // BATTERY
    this.battery = stateObj.attributes?.battery_level ?? null;

    // FAN MODE (режим уборки)
    const fan = stateObj.attributes?.fan_speed;
    if(fan){
      if(this._expectedFan !== null){
        if(fan === this._expectedFan){
          this._expectedFan = null;
          this.selectedMode = fan;
        }
      } else {
        this.selectedMode = fan;
      }
    }
  }

  get hass(){ return this._hass; }

  setConfig(config){
    this.config = {
      tap_action: { action: "more-info" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" },
      title: "Робот пылесос",
      label_battery_suffix: "% заряда",
      label_start: "Начать уборку",
      label_stop: "Остановить уборку",
      card_mod: { style: structuredClone(this.DEFAULT_VACUUM_CARD_MOD) },
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
      : `${this.base}/images/container-images/vacuum-cleaner.png`;

    if (bg && bg !== this._preloadedBg) {
      this._preloadedBg = bg;
      this._bgPreloaded = false;
      const img = new Image();
      img.onload = () => {
        this._bgPreloaded = true;
        // Добавляем класс bg-loaded на карточку для плавного появления
        const frame = this.renderRoot?.querySelector(".frame");
        if (frame) frame.classList.add("bg-loaded");
      };
      img.src = bg;
    }
  }

  // После рендера проверяем — если картинка уже в кэше, сразу показываем
  updated(changedProps) {
    if (changedProps.has("config")) {
      this._preloadBackground();
    }

    const frame = this.renderRoot?.querySelector(".frame");
    if (!frame) return;

    if (this._bgPreloaded) {
      frame.classList.add("bg-loaded");
    }
  }

  static styles = css`
    :host { 
      display: block; 
      min-width:320px;
      width: 100%; 
      font-family: Roboto; 
      color: white;
      border-radius: 24px !important;
      border: none !important;
    }

    .frame{
      display:flex;
      flex-direction:column;
      justify-content:space-between;
      padding:16px;
      gap:24px;
      height:368px;
      border-radius:24px;
      color:white;
      cursor: pointer;
      user-select: none;
      position: relative;
      /* Базовый фон пока картинка не загружена */
      background: #1C1B1F;
    }

    /*
      Фон вынесен в ::before — убирает background-blend-mode с самого .frame.
      background-blend-mode на элементе создаёт stacking context,
      из-за которого position:fixed у дочерних элементов ломается.
      Плавное появление через opacity: 0 → 1 после загрузки.
    */
    .frame::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 24px;
      background-image:
        linear-gradient(0deg, rgba(28, 27, 31, 0.00) 79.67%, #1C1B1F 100%),
        var(--vacuum-bg, none),
        linear-gradient(0deg, #1C1B1F, #1C1B1F);
      background-size: auto, 134.876% 110.996%, auto;
      background-position: center, 9.86px -113.795px, center;
      background-repeat: no-repeat, no-repeat, no-repeat;
      background-blend-mode: normal, luminosity, normal;
      /* Плавное появление — воспринимается быстрее чем резкий pop-in */
      opacity: 0;
      transition: opacity 0.35s ease;
      pointer-events: none;
      z-index: 0;
    }

    .frame.bg-loaded::before {
      opacity: 1;
    }

    .frame::after {
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

    .type{
      display:flex;
      flex-direction:column;
      gap:4px;
      position: relative;
    }

    .title{
      font-weight:600;
      font-size:16px;
    }

    .subtitle{
      font-size:15px;
      opacity:0.8;
    }

    .controls{
      display:flex;
      flex-direction:column;
      gap:8px;
      position: relative;
      z-index: 2 !important;
    }

    ha-select {
      width: 100%;
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

    .start{
      display:flex;
      justify-content:center;
      align-items:center;
      padding:8px 14px;
      height:36px;
      background: rgba(255, 255, 255, 0.10);
      border-radius:12px;
      font-weight:600;
      font-size:14px;
      cursor:pointer;
      position: relative;
      backdrop-filter: blur(12px);
    }

    .start::before {
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

    .start.active{
      background: #4D4A54;
    }
  `;

  _toggleCleaning(e){
    e.stopPropagation();
    const entity = this.config?.entity;
    if(!this.hass?.states?.[entity]) return;

    const service = this.cleaning ? "stop" : "start";
    this._expectedCleaning = !this.cleaning;

    this.hass.callService("vacuum", service, { entity_id: entity });
  }

  _stopPropagation(e){
    e.stopPropagation();
  }

  firstUpdated() {
    const frame = this.shadowRoot?.querySelector(".frame");
    if (!frame) return;

    frame.addEventListener("pointerdown", this._onPointerDown.bind(this));
    frame.addEventListener("pointerup", this._onPointerUp.bind(this));
    frame.addEventListener("click", this._onClick.bind(this));

    // Если картинка уже в кэше — сразу показываем без мигания
    if (this._bgPreloaded) frame.classList.add("bg-loaded");
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._holdTimer) clearTimeout(this._holdTimer);
  }

  _onPointerDown(e) {
    if (e.target.closest('ha-select') || e.target.closest('.start')) return;
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
    if (e.target.closest('ha-select') || e.target.closest('.start')) return;

    const now = Date.now();
    if (this._lastTap && now - this._lastTap < 300) {
      if (hasAction(this.config, 'double_tap_action')) {
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

  render(){
    const bg = this.config.background_image 
      ? this.config.background_image 
      : `${this.base}/images/container-images/vacuum-cleaner.png`;

    const stateObj = this.hass?.states?.[this.config?.entity];
    const fanList = stateObj?.attributes?.fan_speed_list || ["standard", "turbo", "quiet"];

    return html`
    <ha-card>
      <div
        class="frame"
        style="--vacuum-bg: url('${bg}');"
      >
        <div class="type">
          <div class="title">${this.config?.title || ""}</div>
          <div class="subtitle">
            ${this.battery != null ? `${this.battery}${this.config?.label_battery_suffix || ""}` : ""}
          </div>
        </div>

        <div class="controls">
          ${stateObj ? html`
            <ha-select
              .value=${this.selectedMode}
              @pointerdown=${this._stopPropagation}
              @change=${(e) => {
              e.stopPropagation();
              const fanSpeed = e.target.value;
              this.selectedMode = fanSpeed;
              this._expectedFan = fanSpeed;

              this.hass.callService("vacuum", "set_fan_speed", {
                entity_id: this.config.entity,
                fan_speed: fanSpeed
              });
            }}
            >
              ${fanList.map(f => html`
                <mwc-list-item .value=${f}>${this.config?.mode_labels?.[f] || f}</mwc-list-item>
              `)}
            </ha-select>
          ` : ""}

          <div
            class="start ${this.cleaning ? "active" : ""}"
            @pointerdown=${this._stopPropagation}
            @click=${this._toggleCleaning}
          >
            ${this.cleaning ? (this.config?.label_stop || "") : (this.config?.label_start || "")}

          </div>
        </div>
      </div>
    </ha-card>
    `;
  }
}

/* EDITOR */

class EmelyaVacuumCleanerEditor extends LitElement {
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
    .img-preview img { width: 120px; height: 120px; object-fit: contain; }
    .img-preview-empty {
      font-size: 12px; color: var(--secondary-text-color);
      text-align: center; padding: 16px; line-height: 1.5;
    }

    .drop-zone {
      width: 100%; min-height: 96px; box-sizing: border-box;
      border: 2px dashed var(--divider-color); border-radius: 16px;
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 8px; padding: 16px; cursor: pointer;
      background: var(--secondary-background-color); text-align: center;
      transition: border-color 0.2s, background 0.2s;
    }
    .drop-zone.dragover {
      border-color: var(--primary-color);
      background: color-mix(in srgb, var(--primary-color) 10%, transparent);
    }
    .drop-zone.loading { opacity: 0.6; pointer-events: none; }

    .drop-icon { font-size: 28px; line-height: 1; }
    .drop-text { font-size: 13px; color: var(--primary-text-color); }
    .drop-sub  { font-size: 11px; color: var(--secondary-text-color); }

    .drop-btn {
      margin-top: 4px; padding: 6px 14px; border-radius: 8px;
      border: 1px solid var(--primary-color); background: transparent;
      color: var(--primary-color); font-size: 13px; cursor: pointer;
    }

    .status-row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .status-row.success { color: var(--success-color, #43a047); }
    .status-row.error   { color: var(--error-color, #db4437); }

    .current-path {
      display: flex; align-items: center; gap: 8px; font-size: 12px;
      color: var(--secondary-text-color); background: var(--secondary-background-color);
      border: 1px solid var(--divider-color); border-radius: 10px;
      padding: 8px 10px;
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
    const stateObj = this.hass?.states?.[entity];
    const fanList = stateObj?.attributes?.fan_speed_list || [];
    const labels = this._config?.mode_labels || {};

    return html`
      ${this._form([
        { name: "title",                label: "Название",              selector: { text: {} } },
        { name: "label_battery_suffix", label: "Текст заряда",          selector: { text: {} } },
        { name: "label_start",          label: "Кнопка: начать уборку", selector: { text: {} } },
        { name: "label_stop",           label: "Кнопка: остановить",    selector: { text: {} } },
        { name: "entity",    required: true, selector: { entity: { domain: "vacuum" } } },
        { name: "base_path",            selector: { text: {} } }
      ])}

      ${fanList.length ? html`
        <div class="mode-labels">
          <div class="img-label" style="margin-top:16px;margin-bottom:8px;">
            Названия режимов 
          </div>
          ${fanList.map(f => html`
            <div class="mode-label-row">
              <span class="mode-key">${f}</span>
              <input
                type="text"
                placeholder="${f}"
                .value=${labels[f] || ""}
                @input=${(e) => this._updateModeLabel(f, e.target.value)}
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

  _actionsTab() {
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${[
          { name: "tap_action",        label: "При нажатии",         selector: { ui_action: {} } },
          { name: "hold_action",       label: "При удержании",       selector: { ui_action: {} } },
          { name: "double_tap_action", label: "При двойном нажатии", selector: { ui_action: {} } }
        ]}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
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
  _onDragLeave() { this._dragOver = false; }

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

      const resp = await this.hass.fetchWithAuth("/api/config/core/store_image", {
        method: "POST", body: formData
      });

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
        this._setImage(`/api/image/serve/${json.id}/original`);
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

/* Регистрация */
EmelyaVacuumCleaner.getConfigElement = function () {
  return document.createElement("emelya-vacuum-cleaner-editor");
};

EmelyaVacuumCleaner.getStubConfig = function () {
  return {
    title: "Робот пылесос",
    label_battery_suffix: "% заряда",
    label_start: "Начать уборку",
    label_stop: "Остановить уборку",
    entity: "",
    base_path: "/local"
  };
};

customElements.define("emelya-vacuum-cleaner-editor", EmelyaVacuumCleanerEditor);
customElements.define("emelya-vacuum-cleaner", EmelyaVacuumCleaner);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom:emelya-vacuum-cleaner",
  name: "Emelya Vacuum Cleaner",
  description: "Управление роботом-пылесосом",
  preview: true
});