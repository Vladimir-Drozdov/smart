import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";
import { handleAction, hasAction } from "https://unpkg.com/custom-card-helpers@2.0.0/dist/index.m.js?module";

class EmelyaKettleCard extends LitElement {

  static properties = {
    hass: { attribute: false },
    config: { attribute: false },
    power: { type: Boolean, state: true }
  };

  constructor() {
    super();
    this.power = false;
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

      this.power = powerState ? 
        (powerState.state === "on" || powerState.state === "heat" || powerState.state !== "off") : 
        false;
    }
  }

  get hass() { return this._hass; }

  _stopPropagation(e) { e.stopPropagation(); }

  _togglePower(e) {
    e.stopPropagation();
    const entity = this.config.power_entity || this.config.entity;
    if (!entity || !this.hass) return;

    const newPower = !this.power;
    const domain = entity.split(".")[0];

    // Универсальная обработка
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
      // Fallback для fan, light и др.
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

  // Одинарный клик — установка температуры
  _handlePreheat(e) {
    e.stopPropagation();
    this._setTemperature(this.config.preheat_temp || 80);
  }

  _handleBoil(e) {
    e.stopPropagation();
    this._setTemperature(this.config.boil_temp || 100);
  }

  // Двойной клик по всей панели управления (кроме power)
  _handleControlsClick(e) {
    // Проверяем, что клик был НЕ по кнопке питания
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
      background: linear-gradient(291.96deg, #4D4A54 0%, #1C1B1F 50%, #4D4A54 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      z-index: -1;
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
      transition: all 0.2s;
    }

    .mode-btn:active {
      transform: scale(0.96);
    }

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
    }

    .power-btn.active {
      background: #4D4A54;
    }

    .power-btn img {
      width: 28px;
      height: 28px;
    }
  `;

  render() {
    const bg = `${this.base}/images/container-images/kettle.png`;

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

          <div 
            class="controls"
            @click=${this._handleControlsClick}
          >
            <button 
              class="mode-btn" 
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
              class="mode-btn" 
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

  /* ==================== РЕДАКТОР ==================== */
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
      preheat_temp: 80,
      boil_temp: 100
    };
  }
}

class EmelyaKettleCardEditor extends LitElement {
  static properties = { hass: {}, _config: {}, _tab: { state: true } };

  constructor() { super(); this._tab = 0; }

  setConfig(config) { this._config = { ...config }; }

  static styles = css`
    .tabs { display: flex; gap: 8px; margin-bottom: 16px; }
    .tab { 
      padding: 8px 12px; 
      border-radius: 10px; 
      border: 1px solid var(--divider-color); 
      background: var(--secondary-background-color); 
      cursor: pointer; 
    }
    .tab.active { 
      background: var(--primary-color); 
      color: white; 
      border-color: var(--primary-color); 
    }
  `;

  render() {
    if (!this._config) return html``;

    return html`
      <div class="tabs">
        ${["Объект", "Взаимодействия"].map((t, i) => html`
          <div class="tab ${this._tab === i ? "active" : ""}" @click=${() => this._tab = i}>${t}</div>
        `)}
      </div>

      ${this._tab === 0 ? html`
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${[
            { name: "title", selector: { text: {} } },
            { name: "entity", selector: { entity: {} }, label: "Основная entity (опционально)" },
            { name: "power_entity", required: true, selector: { entity: { domain: ["switch", "climate", "input_boolean"] } }, label: "Power Entity (вкл/выкл)" },
            { name: "temp_entity", required: true, selector: { entity: { domain: ["climate", "number", "input_number"] } }, label: "Temperature Entity" },
            { name: "base_path", selector: { text: {} }, label: "Base Path" },
            { name: "preheat_temp", selector: { number: { min: 30, max: 100, step: 1 } }, label: "Температура Подогрева (°C)" },
            { name: "boil_temp", selector: { number: { min: 90, max: 100, step: 1 } }, label: "Температура Кипятка (°C)" }
          ]}
          @value-changed=${this._valueChanged}
        ></ha-form>
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

  _valueChanged = (e) => {
    this._config = e.detail.value;
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    }));
  };
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