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
      // Стили для корневого элемента (.)
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
          border-radius: 16px !important;
          --restore-card-border-radius: 16px !important;
          --ha-card-border-radius: 16px !important;
          box-sizing: border-box !important;                    
        }
      `,

      // Стили для ha-select и его внутренних элементов
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
    this.selectedMode = "Ежедневная уборка";
    this.cleaning = false;
    this.battery = 0;
    this._expectedCleaning = null;
    this._expectedFan = null;
    this.initialFanList = ["standard", "turbo", "quiet"];
    this._holdTimer = null;
    this._lastTap = 0;
  }

  set hass(hass){
    this._hass = hass;
    const entity = this.config?.entity;
    const stateObj = hass.states?.[entity];
    if(!stateObj) return;

    // CLEANING
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
    const battery = stateObj.attributes?.battery_level;
    this.battery = battery !== undefined ? battery : 0;

    // FAN MODE
    const fan = stateObj.attributes?.fan_speed;
    const reverseModeMap = {
      standard: "Ежедневная уборка",
      turbo: "Тщательная уборка",
      quiet: "Быстрая уборка"
    };

    if(fan){
      const newMode = reverseModeMap[fan] || fan;

      if(this._expectedFan !== null){
        if(newMode === this._expectedFan){
          this._expectedFan = null;
          this.selectedMode = newMode;
        }
      } else {
        this.selectedMode = newMode;
      }
    }
  }

  get hass(){ return this._hass; }

  setConfig(config){
    this.config = {
      tap_action: { action: "more-info" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" },
      card_mod: {
        style: structuredClone(this.DEFAULT_VACUUM_CARD_MOD)
      },
      ...config,
    };
    this.base = this.config.base_path || "/local";
  }

  static styles = css`
    :host { 
      display:block; 
      min-width:320px;
      width:100%; 
      font-family:Roboto; 
      color:white;
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
      background-size:cover;
      background-position:center;
      background-blend-mode:luminosity, normal;
      border-radius:24px;
      color:white;
      cursor: pointer;
      user-select: none;
    }
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

    .type{
      display:flex;
      flex-direction:column;
      gap:4px;
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
    }
    ha-select {
      width: 100%;
      position: relative !important;
      background: rgba(255, 255, 255, 0.10);
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
      background:#343239;
      border-radius:12px;
      font-weight:600;
      font-size:14px;
      cursor:pointer;
      transition:0.2s;
      position: relative;
      background:rgba(255, 255, 255, 0.10);
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
    this._expectedCleaning = service === "start" ? true : false;

    this.hass.callService("vacuum", service, {
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
    if (e.target.closest('ha-select') || e.target.closest('.start')) return;

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
    if (e.target.closest('ha-select') || e.target.closest('.start')) return;

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

  render(){
    const bg = `${this.base}/images/container-images/vacuum-cleaner.png`;
    const stateObj = this.hass?.states?.[this.config?.entity];
    const fanList = stateObj?.attributes?.fan_speed_list || this.initialFanList;

    return html`
    <ha-card>
      <div
        class="frame"
        tabindex="0"
        style='
          background: linear-gradient(180deg, rgba(28, 27, 31, 0.00) 77.78%, #1C1B1F 100%), url("${bg}") 9.86px -113.795px / 134.876% 110.996% no-repeat, var(--Background-Surface-2, #1C1B1F);
          background-blend-mode: normal, luminosity, normal;
          border: none;
          border-radius: 24px !important;
        '
      >
        <div class="type">
          <div class="title">Робот пылесос</div>
          <div class="subtitle">
            ${this.battery !== null && this.battery !== 0 ? `${this.battery}% заряда` : ""}
          </div>
        </div>

        <div class="controls">
          ${stateObj ? html`
            <ha-select
              .label=${"Режим уборки"}
              .value=${this.selectedMode}
              @pointerdown=${this._stopPropagation}
              @change=${(e) => {
                e.stopPropagation();
                const mode = e.target.value;
                this.selectedMode = mode;
                this._expectedFan = mode;

                const entity = this.config?.entity;
                const modeMap = {
                  "Ежедневная уборка": "standard",
                  "Тщательная уборка": "turbo",
                  "Быстрая уборка": "quiet"
                };
                const fan = modeMap[mode] || mode;
                if(this.hass?.states?.[entity]){
                  this.hass.callService("vacuum","set_fan_speed",{
                    entity_id: entity,
                    fan_speed: fan
                  });
                }
              }}
            >
              ${fanList.map(f => {
                const modeName = {
                  standard: "Ежедневная уборка",
                  turbo: "Тщательная уборка",
                  quiet: "Быстрая уборка"
                }[f] || f;
                return html`<mwc-list-item .value=${modeName}>${modeName}</mwc-list-item>`;
              })}
            </ha-select>
          ` : ""}

          <div
            class="start ${this.cleaning ? "active" : ""}"
            @pointerdown=${this._stopPropagation}
            @click=${this._toggleCleaning}
          >
            ${this.cleaning ? "Остановить уборку" : "Начать уборку в гостиной"}
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
        selector: { entity: { domain: "vacuum" } } //только vacuum
      },
      { 
        name: "base_path", 
        selector: { text: {} } 
      },
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
EmelyaVacuumCleaner.getConfigElement = function () {
  return document.createElement("emelya-vacuum-cleaner-editor");
};

EmelyaVacuumCleaner.getStubConfig = function () {
  return {
    entity: "",
    base_path: "/local",
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