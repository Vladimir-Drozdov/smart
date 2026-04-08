import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";

import {
  handleAction,
  hasAction
} from "https://unpkg.com/custom-card-helpers@2.0.0/dist/index.m.js?module";

class EmelyaWasherCard extends LitElement {

  static properties = {
    hass: {},
    config: {},
    power: { type: Boolean },
    selectedMode: { state: true },
    modes: { state: true }
  };

  constructor(){
    super(); 
    this.power = false;
    this.selectedMode = "Быстрая стирка";
    this.modes = [];
    this._expectedPower = null;
    this._expectedMode = null;
    this._holdTimer = null;
    this._lastTap = 0;
  }

  set hass(hass){
    this._hass = hass;

    const entity = this.config?.entity;
    const stateObj = hass.states?.[entity];

    // POWER
    if(stateObj){
      const newPower = stateObj.state === "on";

      if(this._expectedPower !== null){
        if(newPower === this._expectedPower){
          this._expectedPower = null;
          this.power = newPower;
        }
      } else {
        this.power = newPower;
      }
    }

    // MODE
    const modeEntity = this.config?.mode_entity;
    const modeState = hass.states?.[modeEntity];

    if(modeState){
      const newMode = modeState.state;
      const options = modeState.attributes?.options || [];

      this.modes = options;

      if(this._expectedMode !== null){
        if(newMode === this._expectedMode){
          this._expectedMode = null;
          this.selectedMode = newMode;
        }
      } else {
        this.selectedMode = newMode;
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
      height:316px;
      border-radius:24px;
      color:white;
      cursor: pointer;
      user-select: none;
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
      opacity:0.5;
    }

    .controls{
      display:flex;
      gap:8px;
      height:56px;
    }

    .power{
      width:80px;
      display:flex;
      justify-content:center;
      align-items:center;
      border-radius:16px;
      background:#343239;
      cursor:pointer;
      transition:0.2s;
    }

    .power.active{
      background:#E65332;
    }

    .power img{
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
    console.log(`Action performed: ${actionType}`);
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

    this.hass.callService("switch", "toggle", {
      entity_id: entity
    });
  }

  _handleSelectChange(e){
    e.stopPropagation();
    const value = e.target.value;
    this.selectedMode = value;
    this._expectedMode = value;

    const modeEntity = this.config?.mode_entity;
    if(!this.hass?.states?.[modeEntity]) return;

    this.hass.callService("select", "select_option", {
      entity_id: modeEntity,
      option: value
    });
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
    const bg = `${this.base}/images/container-images/washing_machine.png`;
    const modeState = this.hass?.states?.[this.config.mode_entity];

    return html`
    <ha-card>
      <div
        class="card"
        style="
          background:
            linear-gradient(180deg, rgba(28,27,31,0) 75%, #1C1B1F 100%),
            url('${bg}') center/cover no-repeat,
            #1C1B1F;
        "
      >

        <div class="header">
          <div class="title">Стиральная машина</div>
          <div class="state">
            ${this.power ? "Включено" : "Выключено"}
          </div>
        </div>

        <div class="controls">

          ${modeState ? html`
            <ha-select
              .label=${modeState.attributes?.friendly_name || "Режим"}
              .value=${this.selectedMode}
              @pointerdown=${this._stopPropagation}
              @change=${this._handleSelectChange}
              @dblclick=${this._handleSelectDblClick}
            >
              ${(modeState.attributes?.options || []).map(opt => html`
                <mwc-list-item .value=${opt}>${opt}</mwc-list-item>
              `)}
            </ha-select>
          ` : ""}

          <div
            class="power ${this.power ? "active" : ""}"
            @pointerdown=${this._stopPropagation}
            @click=${this._togglePower}
          >
            <img src="${this.base}/images/container-images/power_button.png">
          </div>

        </div>

      </div>
    </ha-card>
    `;
  }
}

/* EDITOR */

class EmelyaWasherCardEditor extends LitElement {
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
        selector: { entity: { domain: "switch" } } 
      },
      { 
        name: "mode_entity", 
        required: true, 
        selector: { entity: { domain: "select" } } 
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
EmelyaWasherCard.getConfigElement = function () {
  return document.createElement("emelya-washer-card-editor");
};

EmelyaWasherCard.getStubConfig = function () {
  return {
    entity: "",
    mode_entity: "",
    base_path: this.config.base_path,
  };
};

customElements.define("emelya-washer-card-editor", EmelyaWasherCardEditor);
customElements.define("emelya-washer-card", EmelyaWasherCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom:emelya-washer-card",
  name: "Emelya Washer Card",
  description: "Управление стиральной машиной",
  preview: false
});