import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";
import { handleAction, hasAction } from "https://unpkg.com/custom-card-helpers@2.0.0/dist/index.m.js?module";

class EmelyaKettleCard extends LitElement {

  static properties = {
    hass: { attribute: false },
    config: { attribute: false },
    power: { type: Boolean, state: true },
    _currentTemp: { state: true }
  };

  constructor() {
    super();
    this.power = false;
    this._currentTemp = null;
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
        const raw = hass.states[tempEntity].state;
        const parsed = parseFloat(raw);
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
      this.hass.callService(domain, newPower ? "turn_on" : "turn_off", {
        entity_id: entity
      });
    } else {
      this.hass.callService("homeassistant", newPower ? "turn_on" : "turn_off", {
        entity_id: entity
      });
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
    this._setTemperature(this.config.preheat_temp || 80);
    this._currentTemp = this.config.preheat_temp || 80;
  }

  _handleBoil(e) {
    e.stopPropagation();
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

  firstUpdated() {
    const card = this.shadowRoot?.querySelector(".card");
    if (!card) return;

    card.addEventListener("pointerdown", this._onPointerDown.bind(this));
    card.addEventListener("pointerup", this._onPointerUp.bind(this));
    card.addEventListener("click", this._onClick.bind(this));
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
      transition: background 0.2s, transform 0.1s;
    }

    .mode-btn:active { transform: scale(0.96); }
    .mode-btn.active { background: #4D4A54; }

    .power-btn {
      width: 56px;
      height: 56px;
      border: none;
      background: rgba(255,255,255,0.10);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      flex-shrink: 0;
      transition: background 0.2s;
    }

    .power-btn.active { background: #4D4A54; }

    .power-btn img {
      width: 28px;
      height: 28px;
    }
  `;

  render() {
    const bg = this.config.background_image
      ? this.config.background_image
      : `${this.base}/images/container-images/kettle.png`;

    return html`
      <ha-card>
        <div
          class="card"
          style="
            background: linear-gradient(180deg, rgba(28, 27, 31, 0.00) 56.97%, #1C1B1F 88.4%),
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
            <button
              class="mode-btn ${this._isPreheatActive ? "active" : ""}"
              @pointerdown=${this._stopPropagation}
              @click=${this._handlePreheat}
            >
              Подогрев
            </button>

            <button
              class="power-btn ${this.power ? "active" : ""}"
              @pointerdown=${this._stopPropagation}
              @click=${this._togglePower}
            >
              <img src="${this.base}/images/container-images/power_button.png" alt="power">
            </button>

            <button
              class="mode-btn ${this._isBoilActive ? "active" : ""}"
              @pointerdown=${this._stopPropagation}
              @click=${this._handleBoil}
            >
              Кипяток
            </button>
          </div>
        </div>
      </ha-card>
    `;
  }

  static getConfigElement() {
    return document.createElement("emelya-kettle-card-editor");
  }

  static getStubConfig() {
    return {
      title: "Чайник",
      entity: "",
      power_entity: "",
      temp_entity: "",
      base_path: "/local",
      background_image: "",
      preheat_temp: 80,
      boil_temp: 100
    };
  }
}

/* ==================== РЕДАКТОР ==================== */

class EmelyaKettleCardEditor extends LitElement {
  static properties = {
    hass: {},
    _config: { state: true },
    _tab: { state: true },
    _imgError: { state: true }
  };

  constructor() {
    super();
    this._tab = 0;
    this._imgError = false;
  }

  setConfig(config) {
    this._config = { ...config };
    this._imgError = false;
  }

  static styles = css`
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
      font-size: 14px;
    }
    .tab.active {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }

    .img-field {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .img-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-text-color);
    }

    /* Превью */
    .img-preview {
      width: 100%;
      height: 160px;
      border-radius: 20px;
      overflow: hidden;
      position: relative;
      background: #1C1B1F;
      border: 1px solid rgba(101,101,101,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .img-preview img.preview-img {
      width: 120px;
      height: 120px;
      object-fit: contain;
      display: block;
    }

    .img-preview-empty {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: var(--secondary-text-color);
      text-align: center;
      padding: 16px;
      line-height: 1.5;
      box-sizing: border-box;
    }

    .img-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .img-input {
      flex: 1;
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      padding: 10px 12px;
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      font: inherit;
      font-size: 14px;
      box-sizing: border-box;
      transition: border-color 0.15s;
    }

    .img-input:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    .img-input.error {
      border-color: var(--error-color, #db4437);
    }

    .img-clear {
      width: 38px;
      height: 38px;
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      background: var(--secondary-background-color);
      color: var(--secondary-text-color);
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: color 0.15s, border-color 0.15s;
    }

    .img-clear:hover {
      color: var(--error-color, #db4437);
      border-color: var(--error-color, #db4437);
    }

    .img-error {
      font-size: 12px;
      color: var(--error-color, #db4437);
      line-height: 1.4;
    }

    .img-hint {
      font-size: 12px;
      color: var(--secondary-text-color);
      line-height: 1.6;
    }

    .img-hint code {
      background: var(--secondary-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      padding: 1px 5px;
      font-size: 11px;
    }
  `;

  render() {
    if (!this._config) return html``;

    return html`
      <div class="tabs">
        ${["Основное", "Внешний вид", "Действия"].map((t, i) => html`
          <div class="tab ${this._tab === i ? "active" : ""}" @click=${() => this._tab = i}>${t}</div>
        `)}
      </div>

      ${this._tab === 0 ? html`
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${[
            { name: "title", selector: { text: {} }, label: "Заголовок" },
            { name: "entity", selector: { entity: {} }, label: "Основная entity (опционально)" },
            { name: "power_entity", required: true, selector: { entity: { domain: ["switch", "climate", "input_boolean"] } }, label: "Power Entity (вкл/выкл)" },
            { name: "temp_entity", required: true, selector: { entity: { domain: ["climate", "number", "input_number"] } }, label: "Temperature Entity" },
            { name: "base_path", selector: { text: {} }, label: "Base Path" },
            { name: "preheat_temp", selector: { number: { min: 30, max: 100, step: 1 } }, label: "Температура Подогрева (°C)" },
            { name: "boil_temp", selector: { number: { min: 90, max: 100, step: 1 } }, label: "Температура Кипятка (°C)" }
          ]}
          @value-changed=${this._valueChanged}
        ></ha-form>
      ` : this._tab === 1 ? html`
        <div class="img-field">
          <div class="img-label">Фоновое изображение</div>

          ${this._renderPreview()}

          <div class="img-row">
            <input
              class="img-input ${this._imgError ? "error" : ""}"
              type="text"
              placeholder="/local/images/kettle.png"
              .value=${this._config.background_image || ""}
              @input=${this._onImgInput}
            />
            ${this._config.background_image ? html`
              <button class="img-clear" @click=${this._clearImg} title="Сбросить">✕</button>
            ` : ""}
          </div>

          ${this._imgError ? html`
            <div class="img-error">⚠ Изображение не найдено. Проверь путь — файл должен лежать в папке <code>config/www/</code></div>
          ` : ""}

          <div class="img-hint">
            Файлы из папки <code>config/www/</code> доступны по пути <code>/local/</code>.<br>
            Пример: файл <code>www/images/kettle.png</code> → путь <code>/local/images/kettle.png</code>
          </div>
        </div>
      ` : html`
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${[
            { name: "tap_action", label: "При нажатии", selector: { ui_action: {} } },
            { name: "hold_action", label: "При удержании", selector: { ui_action: {} } },
            { name: "double_tap_action", label: "При двойном нажатии", selector: { ui_action: {} } }
          ]}
          @value-changed=${this._valueChanged}
        ></ha-form>
      `}
    `;
  }

  _renderPreview() {
    const src = this._config?.background_image;

    if (!src) {
      return html`
        <div class="img-preview">
          <div class="img-preview-empty">
            Изображение не задано.<br>
            Будет использована картинка по умолчанию.
          </div>
        </div>
      `;
    }

    return html`
      <div class="img-preview">
        <img
          class="preview-img"
          src=${src}
          alt="preview"
          @error=${this._onImgError}
          @load=${this._onImgLoad}
        />
      </div>
    `;
  }

  _onImgInput(e) {
    const value = e.target.value.trim();
    this._imgError = false;
    const config = { ...this._config, background_image: value || undefined };
    if (!value) delete config.background_image;
    this._config = config;
    this._fire();
  }

  _clearImg() {
    this._imgError = false;
    const config = { ...this._config };
    delete config.background_image;
    this._config = config;
    this._fire();
  }

  _onImgError() { this._imgError = true; }
  _onImgLoad()  { this._imgError = false; }

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

customElements.define("emelya-kettle-card-editor", EmelyaKettleCardEditor);
customElements.define("emelya-kettle", EmelyaKettleCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom:emelya-kettle",
  name: "Emelya Kettle Card",
  description: "Управление чайником",
  preview: true
});