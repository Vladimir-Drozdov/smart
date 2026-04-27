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
    this.mode = "";
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
    const modeObj = hass.states?.[modeEntity];

    if(modeObj){
      const newMode = modeObj.state;
      const options = modeObj.attributes?.options || [];

      this.modes = options.length ? options : this.modes;

      if(this._expectedMode !== null){
        if(newMode === this._expectedMode){
          this._expectedMode = null;
          this.mode = newMode;
        }
      } else {
        this.mode = newMode;
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
      pointer-events: none;                /* чтобы не мешал кликам */
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
      opacity:.6;
    }

    .controls{
      display:flex;
      gap:8px;
      height:56px;
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

    const domain = entity.split(".")[0];
    const service = newPower ? "turn_on" : "turn_off";

    this.hass.callService(domain, service, {
      entity_id: entity
    });
  }

  _handleSelectChange(e){
    e.stopPropagation();
    const value = e.target.value;
    this.mode = value;
    this._expectedMode = value;

    const modeEntity = this.config?.mode_entity;
    if(!this.hass?.states?.[modeEntity]) return;

    const stateObj = this.hass.states[modeEntity];
    const domain = modeEntity.split(".")[0];
    
    // Маппинг доменов на сервисы и параметры
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
    const bg = `${this.base}/images/container-images/humidifier.png`;
    const modeState = this.hass?.states?.[this.config.mode_entity];

    return html`
    <ha-card>
      <div
        class="card"
        style='
          background: linear-gradient(180deg, rgba(28, 27, 31, 0.00) 77.78%, #1C1B1F 100%), url("${bg}") -22.849px 67.463px / 141.697% 141.697% no-repeat, var(--Background-Surface-2, #1C1B1F);
          background-blend-mode: normal, luminosity, normal;
          border: none;
          border-radius: 24px !important;
        '
      >

        <div class="header">
          <div class="title">Увлажнитель</div>
          <div class="state">
            ${this.power
              ? (this.mode || "Включено")
              : "Выключено"}
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
              ${(modeState.attributes?.options || []).map(opt => html`
                <mwc-list-item .value=${opt}>${opt}</mwc-list-item>
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
    _config: {},
    _tab: { state: true }
  };

  static styles = css`
    :host { display: block; box-sizing: border-box; }
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
          <div class="tab ${this._tab === i ? "active" : ""}" @click=${() => this._tab = i}>
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
      { name: "entity", required: true, selector: { entity: { domain: ["switch", "fan", "humidifier"] } } },
      { name: "mode_entity", required: true, selector: { entity: { domain: ["select", "input_select", "fan", "humidifier"] } } },
      { name: "base_path", selector: { text: {} } }
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
EmelyaHumidifierCard.getConfigElement = function () {
  return document.createElement("emelya-humidifier-card-editor");
};

EmelyaHumidifierCard.getStubConfig = function () {
  return {
    entity: "",
    mode_entity: "",
    base_path: this.config.base_path,
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