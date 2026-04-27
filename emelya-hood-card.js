import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";

import {
  handleAction,
  hasAction
} from "https://unpkg.com/custom-card-helpers@2.0.0/dist/index.m.js?module";

const LEVEL_MAP = {1:33, 2:66, 3:100};

class EmelyaHoodCard extends LitElement {

  static properties = {
    hass: {}, 
    config: {},
    level: { type:Number },
    power: { type:Boolean }
  };

  constructor(){
    super();
    this.level = 0;
    this.power = false;
    this._expectedPower = null;
    this._expectedLevel = null;
    this._holdTimer = null;
    this._lastTap = 0;
  }

  set hass(hass){
    this._hass = hass;
    const entity = this.config?.entity;
    const stateObj = hass.states?.[entity];
    if(!stateObj) return;

    const newPower = stateObj.state === "on";

    if(this._expectedPower !== null){
      if(newPower === this._expectedPower){
        this._expectedPower = null;
        this.power = newPower;
      }
    } else {
      this.power = newPower;
    }

    const percentage = stateObj.attributes?.percentage ?? 0;

    let newLevel = 0;
    if(percentage === 0) newLevel = 0;
    else if(percentage <= 33) newLevel = 1;
    else if(percentage <= 67) newLevel = 2;
    else newLevel = 3;

    if(this._expectedLevel !== null){
      if(newLevel === this._expectedLevel){
        this._expectedLevel = null;
        this.level = newLevel;
      }
    } else {
      this.level = newLevel;
    }
  }

  get hass(){ return this._hass; }

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
    :host { display:block; max-width:450px; min-width:320px; font-family:Roboto; color:white; }
    .frame { display:flex; flex-direction:column; justify-content:space-between; padding:16px; height:264px; border-radius:24px; position: relative;}
    .frame::before {
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
      pointer-events: none;                /* чтобы не мешал кликам */
    }
    .title { font-weight:600; font-size:16px; }
    .controls {
      position:relative;
      display: flex;
      height: 56px;
      padding-right: 4px;
      padding-left: 4px;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      align-self: stretch;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.10);
    }
    .controls::before {
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
    .btn { flex:1; display:flex; justify-content:center; align-items:center; height:48px; border-radius:12px; cursor:pointer; }
    .btn.power{
      background: rgba(255, 255, 255, 0.10);
      border: none;
      border-width: 1px; flex-grow: 1; flex-shrink: 0;
      display: flex;
      padding: 16px;
      justify-content: center;
      align-items: center;
      box-sizing:border-box;
      width:64px;
      max-width:64px;
      height:48px;
      position: relative;
    }
    .btn.power::before {
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
    .btn.power.active { background: #4D4A54; }
    .circle { border:2px solid white; border-radius:50%; opacity:0.25; }
    .circle.small{ width:10px; height:10px; }
    .circle.medium{ width:14px; height:14px; }
    .circle.big{ width:18px; height:18px; }
    .btn .circle { opacity:1; border-color: white; }
    .btn.active .circle { opacity:1; border-color:#4D4A54; }
  `;

  _togglePower(e){
    e.stopPropagation();

    const entity = this.config?.entity;
    const newPower = !this.power;

    this.power = newPower;
    this._expectedPower = newPower;

    if(!newPower){
      this.level = 0;
      this._expectedLevel = null;
    }

    if(!this.hass || !entity) return;

    this.hass.callService("fan", newPower ? "turn_on" : "turn_off", {
      entity_id: entity
    });
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
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
  }

  _onPointerDown(e) {
    if (e.target.closest('.btn')) return;

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
    if (e.target.closest('.btn')) return;

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

  _setLevel(level){
    this.level = level;

    if(!this.power){
      this._expectedLevel = null;
      return;
    }

    this._expectedLevel = level;

    const entity = this.config?.entity;
    if(!this.hass || !entity) return;

    this.hass.callService("fan","set_percentage",{
      entity_id: entity,
      percentage: LEVEL_MAP[level]
    });
  }

  render(){
    const bg = `${this.base}/images/container-images/kitchen-hood.png`;

    return html`
      <div
        class="frame"
        tabindex="0"
        style='
          background: linear-gradient(180deg, rgba(28, 27, 31, 0.00) 77.78%, #1C1B1F 100%), url("${bg}") 52.763px -213.194px / 135.625% 164.394% no-repeat, #1C1B1F;
          background-blend-mode: normal, luminosity, normal;
          border: none;
          border-radius: 24px !important;
        '
      >
        <div class="title">Вытяжка</div>

        <div class="controls ${this.power ? "enabled":""}">
          <div class="btn power ${this.power ? "active":""}"
              @pointerdown=${this._stopPropagation}
              @click=${this._togglePower}>
            <img class="icon" src="${this.base}/images/container-images/power_button.png">
          </div>
          
          <div class="btn ${this.level===1?"active":""}"
              @pointerdown=${this._stopPropagation}
              @click=${()=>this._setLevel(1)}>
            <div class="circle small"></div>
          </div>

          <div class="btn ${this.level===2?"active":""}"
              @pointerdown=${this._stopPropagation}
              @click=${()=>this._setLevel(2)}>
            <div class="circle medium"></div>
          </div>

          <div class="btn ${this.level===3?"active":""}"
              @pointerdown=${this._stopPropagation}
              @click=${()=>this._setLevel(3)}>
            <div class="circle big"></div>
          </div>
        </div>
      </div>
    `;
  }
}

/* EDITOR */

class EmelyaHoodCardEditor extends LitElement {
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
        selector: { entity: { domain: "fan" } } //только fan 
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
EmelyaHoodCard.getConfigElement = function () {
  return document.createElement("emelya-hood-card-editor");
};

EmelyaHoodCard.getStubConfig = function () {
  return {
    entity: "",
    base_path: this.config.base_path,
  };
};

customElements.define("emelya-hood-card-editor", EmelyaHoodCardEditor);
customElements.define("emelya-hood-card", EmelyaHoodCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom:emelya-hood-card",
  name: "Emelya Hood Card",
  description: "Управление кухонной вытяжкой",
  preview: true
});