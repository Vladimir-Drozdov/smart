import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";
import { handleAction, hasAction } from "https://unpkg.com/custom-card-helpers@2.0.0/dist/index.m.js?module";

class EmelyaKettleCard extends LitElement {

  static properties = {
    hass: { attribute: false },
    config: { attribute: false },
    power: { type: Boolean, state: true },
    _currentTemp: { state: true },
    _selectedSlot: { state: true }
  };

  constructor() {
    super();
    this.power = false;
    this._currentTemp = null;
    this._selectedSlot = 1;
    this._holdTimer = null;
    this._lastTap = 0;
  }

  setConfig(config) {
    this.config = {
      tap_action: { action: "more-info" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" },
      title: "Чайник",
      preheat_temp: 80,
      boil_temp: 100,
      ...config,
    };
    this.base = this.config.base_path || "/local";
  }

  set hass(hass) {
    this._hass = hass;

    if (hass) {
      const powerEntity = this.config.power_entity || this.config.entity;
      const powerState = hass.states?.[powerEntity];
      this.power = powerState
        ? (powerState.state === "on" || powerState.state === "heat" || powerState.state !== "off")
        : false;

      const tempEntity = this.config.temp_entity;
      if (tempEntity && hass.states?.[tempEntity]) {
        const parsed = parseFloat(hass.states[tempEntity].state);
        this._currentTemp = isNaN(parsed) ? null : parsed;
      } else {
        this._currentTemp = null;
      }
    }
  }

  get hass() { return this._hass; }

  get _isPreheatActive() {
    if (this._currentTemp === null) return false;
    return Math.abs(this._currentTemp - (this.config.preheat_temp || 80)) < 0.5;
  }

  get _isBoilActive() {
    if (this._currentTemp === null) return false;
    return Math.abs(this._currentTemp - (this.config.boil_temp || 100)) < 0.5;
  }

  _stopPropagation(e) { e.stopPropagation(); }

  _togglePower(e) {
    e.stopPropagation();
    this._selectedSlot = 1;
    const entity = this.config.power_entity || this.config.entity;
    if (!entity || !this.hass) return;

    const newPower = !this.power;
    const domain = entity.split(".")[0];

    if (domain === "climate") {
      this.hass.callService("climate", "set_hvac_mode", {
        entity_id: entity,
        hvac_mode: newPower ? "heat" : "off"
      });
    } else if (domain === "switch" || domain === "input_boolean") {
      this.hass.callService(domain, newPower ? "turn_on" : "turn_off", { entity_id: entity });
    } else {
      this.hass.callService("homeassistant", newPower ? "turn_on" : "turn_off", { entity_id: entity });
    }
  }

  _setTemperature(temp) {
    const entity = this.config.temp_entity;
    if (!entity || !this.hass) return;

    const domain = entity.split(".")[0];

    if (domain === "climate") {
      this.hass.callService("climate", "set_temperature", {
        entity_id: entity,
        temperature: temp
      });
    } else if (domain === "number" || domain === "input_number") {
      this.hass.callService(domain, "set_value", {
        entity_id: entity,
        value: temp
      });
    }
  }

  _handlePreheat(e) {
    e.stopPropagation();
    this._selectedSlot = 0;
    this._setTemperature(this.config.preheat_temp || 80);
    this._currentTemp = this.config.preheat_temp || 80;
  }

  _handleBoil(e) {
    e.stopPropagation();
    this._selectedSlot = 2;
    this._setTemperature(this.config.boil_temp || 100);
    this._currentTemp = this.config.boil_temp || 100;
  }

  _handleControlsClick(e) {
    if (e.target.closest('.power-btn')) return;

    const tempEntity = this.config.temp_entity;
    if (tempEntity && this.hass) {
      this.dispatchEvent(new CustomEvent("hass-more-info", {
        detail: { entityId: tempEntity },
        bubbles: true,
        composed: true
      }));
    }
  }

  _performAction(actionType) {
    if (!this.hass || !this.config) return;
    handleAction(this, this.hass, this.config, actionType);
  }

  // Единственный firstUpdated — слушатели + индикатор
  firstUpdated() {
    const card = this.shadowRoot?.querySelector(".card");
    if (!card) return;

    card.addEventListener("pointerdown", this._onPointerDown.bind(this));
    card.addEventListener("pointerup", this._onPointerUp.bind(this));
    card.addEventListener("click", this._onClick.bind(this));

    // Позиционируем индикатор после того как браузер посчитал layout
    requestAnimationFrame(() => this._updateIndicator());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._holdTimer) clearTimeout(this._holdTimer);
  }

  _onPointerDown(e) {
    if (e.target.closest(".power-btn")) return;
    if (hasAction(this.config, "hold_action")) {
      this._holdTimer = setTimeout(() => this._performAction("hold"), 500);
    }
  }

  _onPointerUp() {
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
  }

  _onClick(e) {
    if (e.target.closest(".controls")) return;

    const now = Date.now();
    if (this._lastTap && now - this._lastTap < 300) {
      if (hasAction(this.config, "double_tap_action")) {
        this._performAction("double_tap");
        this._lastTap = 0;
        return;
      }
    }
    this._lastTap = now;

    setTimeout(() => {
      if (this._lastTap === now) this._performAction("tap");
    }, 320);
  }

  get _activeSlot() {
    return this._selectedSlot ?? 1;
  }

  static styles = css`
    :host, ha-card {
      display: block;
      width: 100%;
      border: none !important;
      border-radius: 24px !important;
    }

    .card {
      position: relative;
      box-sizing: border-box;
      width: 100%;
      height: 320px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-radius: 24px;
      overflow: hidden;
      color: #fff;
      font-family: Roboto, sans-serif;
      cursor: pointer;
      user-select: none;
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

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 1;
    }

    .title { font-size: 16px; font-weight: 600; }
    .state { font-size: 15px; color: rgba(255,255,255,0.6); }

    .controls {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px;
      width: 100%;
      height: 64px;
      background: rgba(255,255,255,0.10);
      border-radius: 16px;
      z-index: 1;
      cursor: pointer;
      box-sizing: border-box;
      position: relative;
      backdrop-filter: blur(12px);
    }

    .mode-btn {
      flex: 1;
      height: 56px;
      border: none;
      background: transparent;
      color: rgba(255,255,255,0.92);
      font-size: 16px;
      font-weight: 600;
      border-radius: 16px;
      cursor: pointer;
      transition: transform 0.1s;
      position: relative;
      z-index: 1;
    }

    .mode-btn:active { transform: scale(0.96); }

    .power-btn {
      width: 56px;
      height: 56px;
      border: none;
      background: transparent;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      flex-shrink: 0;
      z-index: 1;
    }

    .power-btn img {
      width: 28px;
      height: 28px;
    }

    .indicator {
      position: absolute;
      top: 4px;
      height: calc(100% - 8px);
      background: rgba(255,255,255,0.18);
      border-radius: 12px;
      pointer-events: none;
      z-index: 0;
      transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                  width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `;

  updated() {
    this._updateIndicator();
  }

  _updateIndicator() {
    const root = this.shadowRoot;
    if (!root) return;

    const controls = root.querySelector(".controls");
    const indicator = root.getElementById("indicator");
    const activeBtn = root.getElementById(`btn-${this._activeSlot}`);

    if (!controls || !indicator || !activeBtn) return;

    const cRect = controls.getBoundingClientRect();
    const bRect = activeBtn.getBoundingClientRect();

    indicator.style.left = `${bRect.left - cRect.left}px`;
    indicator.style.width = `${bRect.width}px`;
  }

  render() {
    const bg = this.config.background_image
      ? this.config.background_image
      : `${this.base}/images/container-images/kettle.png`;

    return html`
      <ha-card>
        <div
          class="card"
          style="
            background: linear-gradient(180deg, rgba(28, 27, 31, 0.00) 60%, #1C1B1F 88.4%),
                        url('${bg}') 53.318px 57.809px / 81.463% 82.494% no-repeat,
                        #1C1B1F;
            background-blend-mode: normal, luminosity, normal;
          "
        >
          <div class="header">
            <div class="title">${this.config?.title || "Чайник"}</div>
            <div class="state">${this.power ? "Включено" : "Выключено"}</div>
          </div>

          <div class="controls" @click=${this._handleControlsClick}>
            <div class="indicator" id="indicator"></div>

            <button class="mode-btn" id="btn-0" @pointerdown=${this._stopPropagation} @click=${this._handlePreheat}>
              Подогрев
            </button>

            <button class="power-btn" id="btn-1" @pointerdown=${this._stopPropagation} @click=${this._togglePower}>
              <img src="${this.base}/images/container-images/power_button.png" alt="power">
            </button>

            <button class="mode-btn" id="btn-2" @pointerdown=${this._stopPropagation} @click=${this._handleBoil}>
              Кипяток
            </button>
          </div>
        </div>
      </ha-card>
    `;
  }
}

/* ==================== EDITOR ==================== */

class EmelyaKettleCardEditor extends LitElement {
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
  }

  setConfig(config) {
    this._config = { ...config };
  }

  render() {
    if (!this._config) return html``;

    return html`
      <div class="tabs">
        ${["Основное", "Внешний вид", "Действия"].map((t, i) => html`
          <div class="tab ${this._tab === i ? "active" : ""}" @click=${() => this._tab = i}>${t}</div>
        `)}
      </div>

      ${this._tab === 0 ? this._mainTab() : ""}
      ${this._tab === 1 ? this._appearanceTab() : ""}
      ${this._tab === 2 ? this._actionsTab() : ""}
    `;
  }

  _mainTab() {
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${[
          { name: "title",        label: "Заголовок",                  selector: { text: {} } },
          { name: "entity",       label: "Основная entity (опционально)", selector: { entity: {} } },
          { name: "power_entity", label: "Power Entity",  required: true, selector: { entity: { domain: ["switch", "climate", "input_boolean"] } } },
          { name: "temp_entity",  label: "Temperature Entity", required: true, selector: { entity: { domain: ["climate", "number", "input_number"] } } },
          { name: "base_path",    label: "Base Path",          selector: { text: {} } },
          { name: "preheat_temp", label: "Температура Подогрева (°C)", selector: { number: { min: 30, max: 100, step: 1 } } },
          { name: "boil_temp",    label: "Температура Кипятка (°C)",  selector: { number: { min: 90, max: 100, step: 1 } } }
        ]}
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

  /* ── Drag & Drop ── */
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

      const resp = await this.hass.fetchWithAuth("/api/config/core/store_image", {
        method: "POST",
        body: formData
      });

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
        this._setImage(`/api/image/serve/${json.id}/original`);
        this._uploadState = "success";
        return;
      }

      throw new Error(`HTTP ${resp.status}`);
    } catch (err) {
      this._uploadState = "error";
      this._uploadError = `Не удалось загрузить файл (${err.message}). Поместите вручную в config/www/.`;
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

/* ── Регистрация ── */

EmelyaKettleCard.getConfigElement = function () {
  return document.createElement("emelya-kettle-card-editor");
};

EmelyaKettleCard.getStubConfig = function () {
  return {
    title: "Чайник",
    power_entity: "",
    temp_entity: "",
    base_path: "/local",
    preheat_temp: 80,
    boil_temp: 100,
    tap_action: { action: "more-info" },
    hold_action: { action: "none" },
    double_tap_action: { action: "none" },
  };
};

if (!customElements.get("emelya-kettle-card-editor")) {
  customElements.define("emelya-kettle-card-editor", EmelyaKettleCardEditor);
}

if (!customElements.get("emelya-kettle")) {
  customElements.define("emelya-kettle", EmelyaKettleCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.find(c => c.type === "custom:emelya-kettle")) {
  window.customCards.push({
    type: "custom:emelya-kettle",
    name: "Emelya Kettle Card",
    description: "Управление чайником",
    preview: true
  });
}