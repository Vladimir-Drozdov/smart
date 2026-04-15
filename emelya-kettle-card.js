import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";

import {
  handleAction,
  hasAction
} from "https://unpkg.com/custom-card-helpers@2.0.0/dist/index.m.js?module";

class EmelyaKettleCard extends LitElement {

  static properties = {
    hass: {},
    config: {},
    power: { type: Boolean },
    temperature: { type: Number }
  };

  constructor(){
    super();
    this.power = false;
    this.temperature = 0;
    this._expectedPower = null;
    this._holdTimer = null;
    this._lastTap = 0;
  }

  set hass(hass){
    this._hass = hass;

    // POWER
    const powerEntity = this.config.power_entity || this.config.entity;
    const powerStateObj = hass.states?.[powerEntity];

    if(powerStateObj){
      let newPower = false;
      const domain = powerEntity.split(".")[0];

      if(domain === "climate") {
        newPower = powerStateObj.state !== "off";
      } else if(domain === "switch" || domain === "input_boolean") {
        newPower = powerStateObj.state === "on";
      } else {
        newPower = powerStateObj.state !== "off" && powerStateObj.state !== "unavailable";
      }

      if(this._expectedPower !== null){
        if(newPower === this._expectedPower){
          this._expectedPower = null;
          this.power = newPower;
        }
      } else {
        this.power = newPower;
      }
    }

    // TEMPERATURE
    const tempEntity = this.config.temp_entity || this.config.entity;
    const tempStateObj = hass.states?.[tempEntity];

    if(tempStateObj){
      let newTemp = 0;
      const domain = tempEntity.split(".")[0];

      if(domain === "climate") {
        newTemp = tempStateObj.attributes?.temperature ?? 0;
      } else {
        newTemp = Number(tempStateObj.state) || 0;
      }

      this.temperature = newTemp;
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
      ...config,
    };
    this.base = this.config.base_path || "/local";
  }

  static styles = css`
    :host { 
      display: block; 
      max-width: 320px; 
      width: 100%; 
      font-family: Roboto; 
      color: white; 
    }

    .card{
      width:100%;
      box-sizing:border-box;
      display:flex;
      flex-direction:column;
      justify-content:space-between;
      padding:16px;
      height:132px;
      background: #1C1B1F;
      border-radius:24px;
      color:white;
      cursor: pointer;
      user-select: none;
    }
    .card::before {
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
      justify-content:space-between;
    }

    .box{
      height:56px;
      width: 80px;
      background: #1C1B1F;
      border-radius:16px;
      display:flex;
      justify-content:center;
      align-items:center;
      border:1px solid transparent;
      font-weight:600;
      cursor: pointer;
      flex-direction:row;
      position: relative;
    }
    .box::before {
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

    .value{
      min-width:40px;
      text-align:center;
      font-weight:600;
    }

    .power{
      width:80px;
      height:56px;
      background:#343239;
      border-radius:16px;
      display:flex;
      justify-content:center;
      align-items:center;
      cursor:pointer;
      transition:background 0.2s;
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
      background:#E65332;
    }

    img{
      width:24px;
      height:24px;
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
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
  }

  _onPointerDown(e) {
    if (e.target.closest('.box.temp') || e.target.closest('.power')) return;

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
    if (e.target.closest('.box.temp') || e.target.closest('.power')) return;

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
    console.log(`Action performed: ${actionType}`);
    if (!this.hass || !this.config) return;
    handleAction(this, this.hass, this.config, actionType);
  }

  _toggle(e){
    e.stopPropagation();
    const newPower = !this.power;
    this.power = newPower;
    this._expectedPower = newPower;

    const entity = this.config.power_entity || this.config.entity;
    if(!this.hass?.states?.[entity]) return;

    const domain = entity.split(".")[0];

    if(domain === "climate") {
      this.hass.callService("climate", "set_hvac_mode", {
        entity_id: entity,
        hvac_mode: newPower ? "heat" : "off"
      });
    } else if(domain === "switch" || domain === "input_boolean") {
      this.hass.callService("homeassistant", newPower ? "turn_on" : "turn_off", {
        entity_id: entity
      });
    } else {
      this.hass.callService(domain, newPower ? "turn_on" : "turn_off", {
        entity_id: entity
      });
    }
  }

  _handleTempClick(e){
    e.stopPropagation();
    const entity = this.config.temp_entity || this.config.entity;
    if(entity) {
      this.dispatchEvent(new CustomEvent("hass-more-info", {
        detail: { entityId: entity },
        bubbles: true,
        composed: true
      }));
    }
  }

  render(){
    return html`
      <div class="card">

        <div class="header">
          <div class="title">Чайник</div>
          <div class="state">
            ${this.power ? "Нагревает" : "Выключено"}
          </div>
        </div>

        <div class="controls">
          <div class="box temp" @click=${this._handleTempClick}>
            <div class="value">
              ${this.temperature} °C
            </div>
          </div>

          <div class="power ${this.power ? "active" : ""}" 
              @pointerdown=${this._stopPropagation}
              @click=${this._toggle}>
            <img src="${this.base}/images/container-images/power_button.png">
          </div>
        </div>

      </div>
    `;
  }
}

/*  EDITOR  */

class EmelyaKettleCardEditor extends LitElement {
  static properties = {
    hass: {},
    _config: {},
    _tab: { state: true }
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
    }

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

  constructor() {
    super();
    this._tab = 0;
  }

  setConfig(config) {
    this._config = { ...config };
  }

  render() {
    if (!this._config) return html``;

    return html`
      <div class="tabs">
        ${["Объект", "Взаимодействия"].map((t, i) => html`
          <div
            class="tab ${this._tab === i ? "active" : ""}"
            @click=${() => this._tab = i}
          >
            ${t}
          </div>
        `)}
      </div>

      ${this._tab === 0 ? this._objectTab() : ""}
      ${this._tab === 1 ? this._actionsTab() : ""}
    `;
  }

  _objectTab() {
    return this._form([
      { 
        name: "entity", 
        required: true, 
        selector: { entity: { domain: ["switch", "climate", "input_boolean"] } } 
      },
      { 
        name: "power_entity", 
        selector: { entity: { domain: ["switch", "climate", "input_boolean"] } } 
      },
      { 
        name: "temp_entity", 
        selector: { entity: { domain: ["number", "climate", "sensor"] } } 
      },
      { 
        name: "base_path", 
        selector: { text: {} } 
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
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    }));
  };
}

/* Регистрация */
EmelyaKettleCard.getConfigElement = function () {
  return document.createElement("emelya-kettle-card-editor");
};

EmelyaKettleCard.getStubConfig = function () {
  return {
    entity: "",
    power_entity: "",
    temp_entity: "",
    base_path: this.config.base_path,
  };
};

customElements.define("emelya-kettle-card-editor", EmelyaKettleCardEditor);
customElements.define("emelya-kettle-card", EmelyaKettleCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom:emelya-kettle-card",
  name: "Emelya Kettle Card",
  description: "Управление чайником",
  preview: false
});