import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";
import {
  handleAction,
  hasAction
} from "https://unpkg.com/custom-card-helpers@2.0.0/dist/index.m.js?module";

class EmelyaCoffeeCard extends LitElement {
  static properties = {
    hass: {},
    config: {},
    selectedCoffee: { state: true },
    power: { type: Boolean },
    coffeeTypes: { state: true }
  };
  DEFAULT_COFFEE_CARD_MOD = {
    // Стили для корневого элемента (.)
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

  constructor() {
    super();
    this.power = false;
    this.selectedCoffee = "";
    this.coffeeTypes = [];
    this._expectedPower = null;
    this._expectedCoffee = null;
    this._holdTimer = null;
    this._lastTap = 0;
  }

  set hass(hass) {
    this._hass = hass;

    const entity = this.config?.entity;
    const stateObj = hass?.states?.[entity];

    if (stateObj) {
      const newPower = stateObj.state === "on";
      if (this._expectedPower !== null) {
        if (newPower === this._expectedPower) {
          this._expectedPower = null;
          this.power = newPower;
        }
      } else {
        this.power = newPower;
      }
    }

    const coffeeEntity = this.config?.coffee_entity;
    const coffeeState = hass?.states?.[coffeeEntity];

    if (coffeeState) {
      this.coffeeTypes = coffeeState.attributes?.options || [];
      const newCoffee = coffeeState.state;

      if (this._expectedCoffee !== null) {
        if (newCoffee === this._expectedCoffee) {
          this._expectedCoffee = null;
          this.selectedCoffee = newCoffee;
        }
      } else {
        this.selectedCoffee = newCoffee || "";
      }
    }
  }

  get hass() {
    return this._hass;
  }

  setConfig(config) {
    this.config = {
      tap_action: { action: "more-info" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" },
      title: "Кофеварка",
      entity: "switch.coffee_machine",
      coffee_entity: "input_select.coffee",
      base_path: "/local",
      card_mod: {
        style: structuredClone(this.DEFAULT_COFFEE_CARD_MOD)
      },
      ...config,
    };

    this.base = this.config.base_path || "/local";
  }

  static styles = css`
    :host {
      display: block;
      max-width: 450px;
      min-width: 320px;
      width: 100%;
      font-family: Roboto, sans-serif;
      color: white;
      border-radius: 24px !important;
      border: none !important;
    }

    ha-card {
      border-radius: 24px !important;
      border: none !important;
    }

    .card {
      width: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 16px;
      height: 320px;
      border-radius: 24px;
      color: white;
      cursor: pointer;
      user-select: none;
      position: relative;
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
      position: relative;
      z-index: 1;
    }

    .title {
      font-size: 16px;
      font-weight: 600;
    }

    .state {
      font-size: 15px;
      opacity: 0.6;
    }

    .controls {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .power {
      display: flex;
      width: 56px;
      height: 56px;
      padding: 20px;
      justify-content: center;
      align-items: center;
      gap: 8px;
      aspect-ratio: 1 / 1;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.10);
      box-sizing: border-box;
      position: relative;
      flex-shrink: 0;
      cursor: pointer;
    }

    .power::before {
      content: "" !important;
      position: absolute !important;
      inset: 0 !important;
      padding: 1px !important;
      border-radius: inherit !important;
      background: linear-gradient(
        135deg,
        rgba(101, 101, 101, 0) 0%,
        #656565 50%,
        rgba(101, 101, 101, 0) 100%
      ) !important;
      pointer-events: none !important;
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor !important;
      mask-composite: exclude !important;
    }

    .power.active {
      background: #4D4A54;
    }

    .power img {
      width: 24px;
      height: 24px;
      object-fit: contain;
    }

    ha-select {
      width: 100%;
      position: relative !important;
      background: rgba(255, 255, 255, 0.10) !important;
      border-radius: 16px;
    }

    ha-select::before {
      content: "" !important;
      position: absolute !important;
      inset: 0 !important;
      padding: 1px !important;
      border-radius: inherit !important;
      background: linear-gradient(
        165deg,
        rgba(101, 101, 101, 0) 0%,
        #656565 50%,
        rgba(101, 101, 101, 0) 100%
      ) !important;
      pointer-events: none !important;
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor !important;
      mask-composite: exclude !important;
    }
  `;

  _stopPropagation(e) {
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
    if (e.target.closest("ha-select") || e.target.closest(".power")) return;

    if (hasAction(this.config, "hold_action")) {
      this._holdTimer = setTimeout(() => {
        this._performAction("hold");
      }, 500);
    }
  }

  _onPointerUp() {
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
  }

  _onClick(e) {
    if (e.target.closest("ha-select") || e.target.closest(".power")) return;

    const now = Date.now();

    if (this._lastTap && now - this._lastTap < 300) {
      if (hasAction(this.config, "double_tap_action")) {
        e.stopImmediatePropagation();
        this._performAction("double_tap");
        this._lastTap = 0;
        return;
      }
    }

    this._lastTap = now;
    setTimeout(() => {
      if (this._lastTap === now) {
        this._performAction("tap");
      }
    }, 320);
  }

  _performAction(actionType) {
    if (!this.hass || !this.config) return;
    handleAction(this, this.hass, this.config, actionType);
  }

  _togglePower(e) {
    e.stopPropagation();

    const entity = this.config?.entity;
    if (!entity || !this.hass) return;

    const newPower = !this.power;
    this.power = newPower;
    this._expectedPower = newPower;

    const domain = entity.split(".")[0];

    if (domain === "switch") {
      this.hass.callService("switch", "toggle", { entity_id: entity });
    } else {
      this.hass.callService("homeassistant", newPower ? "turn_on" : "turn_off", {
        entity_id: entity
      });
    }
  }

  _handleSelectChange(e) {
    e.stopPropagation();

    const value = e.target.value;
    this.selectedCoffee = value;
    this._expectedCoffee = value;

    const coffeeEntity = this.config?.coffee_entity;
    if (!coffeeEntity || !this.hass?.states?.[coffeeEntity]) return;

    const domain = coffeeEntity.split(".")[0];

    if (domain === "input_select") {
      this.hass.callService("input_select", "select_option", {
        entity_id: coffeeEntity,
        option: value
      });
    } else {
      this.hass.callService("select", "select_option", {
        entity_id: coffeeEntity,
        option: value
      });
    }
  }

  _handleSelectDblClick(e) {
    e.stopPropagation();

    if (this.config.coffee_entity) {
      this.dispatchEvent(new CustomEvent("hass-more-info", {
        detail: { entityId: this.config.coffee_entity },
        bubbles: true,
        composed: true
      }));
    }
  }

  render() {
    const coffeeState = this.hass?.states?.[this.config?.coffee_entity];
    const bg = `${this.base}/images/container-images/coffee_machine.png`;

    return html`
      <ha-card>
        <div
          class="card"
          style='
            background:
              linear-gradient(180deg, rgba(28, 27, 31, 0.00) 69.34%, #1C1B1F 100%),
              url("${bg}") 88px 53.12px / 74.782% 76.117% no-repeat,
              #1C1B1F;
            background-blend-mode: normal, luminosity, normal;
            border: none;
            border-radius: 24px !important;
          '
        >
          <div class="header">
            <div class="title">${this.config?.title || "Кофеварка"}</div>
            <div class="state">${this.power ? "Включено" : "Выключено"}</div>
          </div>

          <div class="controls">
            <div
              class="power ${this.power ? "active" : ""}"
              @pointerdown=${this._stopPropagation}
              @click=${this._togglePower}
            >
              <img src="${this.base}/images/container-images/power_button.png" alt="power">
            </div>

            ${coffeeState ? html`
              <ha-select
                .label=${coffeeState.attributes?.friendly_name || "Тип кофе"}
                .value=${this.selectedCoffee}
                @pointerdown=${this._stopPropagation}
                @change=${this._handleSelectChange}
                @dblclick=${this._handleSelectDblClick}
              >
                ${(coffeeState.attributes?.options || []).map(opt => html`
                  <mwc-list-item .value=${opt}>${opt}</mwc-list-item>
                `)}
              </ha-select>
            ` : ""}
          </div>
        </div>
      </ha-card>
    `;
  }

  static getConfigElement() {
    return document.createElement("emelya-coffee-card-editor");
  }

  static getStubConfig() {
    return {
      title: "Кофеварка",
      entity: "switch.coffee_machine",
      coffee_entity: "input_select.coffee",
      base_path: "/local",
      tap_action: { action: "more-info" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" }
    };
  }
}

/* ==================== EDITOR ==================== */
class EmelyaCoffeeCardEditor extends LitElement {
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
    this._config = {
      title: "Кофеварка",
      base_path: "/local",
      entity: "switch.coffee_machine",
      coffee_entity: "input_select.coffee",
      ...config
    };
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
        name: "title",
        selector: { text: {} },
        label: "Название"
      },
      {
        name: "entity",
        required: true,
        selector: { entity: { domain: ["switch", "input_boolean"] } },
        label: "Entity"
      },
      {
        name: "coffee_entity",
        required: true,
        selector: { entity: { domain: ["input_select", "select"] } },
        label: "Coffee Entity"
      },
      {
        name: "base_path",
        selector: { text: {} },
        label: "Base Path"
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

/* ==================== REGISTRATION ==================== */
customElements.define("emelya-coffee-card-editor", EmelyaCoffeeCardEditor);
customElements.define("emelya-coffee-card", EmelyaCoffeeCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom:emelya-coffee-card",
  name: "Emelya Coffee Card",
  description: "Управление кофеваркой",
  preview: true
});