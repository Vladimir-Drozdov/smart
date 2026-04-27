import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";

import {
  handleAction,
  hasAction,
  fireEvent,
} from "https://unpkg.com/custom-card-helpers@2.0.0/dist/index.m.js?module";

class DualThermostatCard extends LitElement {

static properties = {
    hass: {},
    config: {},
    active: { type: Number },
    powerOn: { type: Boolean }
  };

  constructor() {
    super();
    this.active = 0;
    this.powerOn = false;
    this._holdTimer = null;
    this._lastTap = 0;
    this.card1 = null;
    this.card2 = null;
  }

  // ==================== УТИЛИТЫ ====================
  clone(value) {
    return value == null ? value : structuredClone(value);
  }

  deepMerge(target, source) {
    const output = this.clone(target);
    if (!source) return output;

    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = this.deepMerge(output[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    });
    return output;
  }

  // ==================== CONFIG ====================
  setConfig(config) {
    this.config = {
      tap_action: { action: "more-info" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" },
      objects: [],
      ...this.clone(config || {}),
      ...config,
    };

    // Обрабатываем вложенные dual-thermostat-card в objects
    this.config.objects = (this.config.objects || []).map((obj) => {
      if (obj?.type === "custom:dual-thermostat-card") {
        return this.normalizeThermostatObject(obj);
      }
      return obj;
    });

    // АВТОМАТИЧЕСКОЕ НАЛОЖЕНИЕ card_mod
    const autoMods = this.buildDualThermostatCardMods(this.config);
    this.config.card_mod  = this.deepMerge(autoMods.card_mod,  this.config.card_mod  || {});
    this.config.card_mod1 = this.deepMerge(autoMods.card_mod1, this.config.card_mod1 || {});
    this.config.card_mod2 = this.deepMerge(autoMods.card_mod2, this.config.card_mod2 || {});

    this.base = this.config.base_path || "/local";
  }

  set hass(hass) {
    this._hass = hass;
    if (this.card1) this.card1.hass = hass;
    if (this.card2) this.card2.hass = hass;
    this.updatePowerState();
    this.requestUpdate();
  }
  get hass() { return this._hass; }

  isObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  static styles = css`
    :host { display: block; max-width:450px; min-width:320px; width: 100%;
      border-radius: 24px !important;
      border: none !important;
    }
    .card {
      width: 100%;
      height: 424px;
      box-sizing: border-box;
      border-radius: 24px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      cursor: pointer;
      user-select: none;
      position:relative;
      background-image:
        linear-gradient(#1C1B1F,#1C1B1F),
        linear-gradient(291.96deg, #4D4A54 0%, #1C1B1F 50%, #4D4A54 100%);
      border: 1px solid transparent;
      border-width: 1px;
      border-style: solid;
      background-origin: border-box, border-box;
      background-clip: padding-box, border-box;
    }

    .content { 
      display: flex; 
      flex-direction: column; 
      flex: 1; 
      position: relative;
    }

    .buttons {
      display: flex;
      justify-content: center;
      gap: 12px;
      padding: 0 16px 16px;
      background: #1C1B1F;
    }

    .btn {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #1C1B1F;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s;
      position: relative;
    }
    .btn::before {
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

    .btn.power.active {
      background: #343239;;
    }

    .btn img { width: 24px; height: 24px; }

    .toggle {
      position: relative;
      display: flex;
      align-items: center;
      padding: 4px;
      width: 120px;
      height: 64px;
      background: #1C1B1F;
      border-radius: 96px;
      box-sizing: border-box;
      position: relative;
    }
    .toggle::before {
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

    .slider {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 56px;
      height: 56px;
      border-radius: 96px;
      background: #343239;
      transition: transform 0.25s ease;
    }
    .slider.cool { transform: translateX(56px); }

    .toggle-btn {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      cursor: pointer;
      z-index: 1;
    }
    .toggle-btn img { width: 24px; height: 24px; }
  `;

  buildDualThermostatCardMods(config = {}) {
    const entity1 = config.entity1 || "climate.heatpump";

    const circularSliderStyle = `
      :host {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        background: #1C1B1F !important;
        --ha-card-background: #1C1B1F !important;
        --card-background-color: #1C1B1F !important;
        --state-climate-heat-color: #FFF !important;
        --state-climate-cool-color: #FFF !important;
        --control-circular-slider-color: #FFF !important;
        --control-circular-slider-high-color: #FFF !important;
        --control-circular-slider-low-color: #FFF !important;
        --control-circular-slider-thumb-color: #343239 !important;
        --control-circular-slider-handle-color: #343239 !important;
        --slider-thumb-color: #343239 !important;
        --action-color: transparent !important;
      }

      svg {
        width: 240px !important;
        height: 240px !important;
      }
    `;

    const mainCardStyle = `
      .title {
        text-align: start !important;
        padding: 16px 0 0 16px !important;
      }

      :host {
        background: #1C1B1F !important;
        border-radius: 24px !important;
        --ha-card-background: #1C1B1F !important;
        --card-background-color: #1C1B1F !important;
        --min-temp: "{{ state_attr('${entity1}','min_temp') }}°";
        --max-temp: "{{ state_attr('${entity1}','max_temp') }}°";
        --state-climate-heat-color: transparent !important;
        --state-climate-active-color: transparent !important;
        --state-active-color: transparent !important;
        --action-color: transparent !important;
      }

      ha-card {
        border-width: 0 !important;
        border-style: none !important;
        border-color: transparent !important;
        border: none !important;
        --ha-card-border-width: 0 !important;
        --ha-card-border-style: none !important;
        --ha-card-border-color: transparent !important;
      }

      ha-card::slotted(.container) {
        height: 288px !important;
      }

      ha-card .container {
        height: 288px !important;
        flex: 0 0 auto !important;
      }
    `;

    const climateRootStyle = `
      :host {
        background: #1C1B1F !important;
        --ha-card-background: #1C1B1F !important;
        --card-background-color: #1C1B1F !important;
      }
    `;

    const buttonsStyle = `
      ha-outlined-icon-button {
        position: relative !important;
        border-radius: 24px !important;
        --_outline-color: transparent !important;
      }

      ha-outlined-icon-button::before {
        content: "" !important;
        position: absolute !important;
        inset: 0 !important;
        padding: 1px !important;
        border-radius: 24px !important;
        z-index: 4 !important;
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
    `;

    const outlinedButtonStyle = `
      .icon-button.outlined {
        background: #323135 !important;
        color: white !important;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        border: none !important;
      }

      .icon-button.outlined .icon {
        transform: scale(0.6);
        transform-origin: center;
        color: white !important;
      }
    `;

    const firstButtonStyle = `
      .icon-button.outlined::after {
        content: "{{ state_attr('${entity1}','min_temp')|round(0) }}°C";
        position: absolute;
        left: -35px;
        top: 30%;
        color: #8E8D8F;
        white-space: nowrap;
        text-align: center;
        font-family: Roboto;
        font-size: 16px;
        font-style: normal;
        font-weight: 400;
        line-height: 20px;
      }

      #button {
        background: #323135 !important;
      }
    `;

    const lastButtonStyle = `
      .icon-button.outlined::after {
        content: "{{ state_attr('${entity1}','max_temp')|round(0) }}°C";
        position: absolute;
        right: -45px;
        top: 30%;
        color: #8E8D8F;
        white-space: nowrap;
        text-align: center;
        font-family: Roboto;
        font-size: 16px;
        font-style: normal;
        font-weight: 400;
        line-height: 20px;
      }

      #button {
        background: #323135 !important;
      }
    `;

    const hideSecondaryIconStyle = `
      :host {
        display: none !important;
      }
    `;

    const bigNumberStyle = `
      .decimal {
        opacity: 0 !important;
        visibility: hidden !important;
      }
    `;

    const climateMiscStyle = `
      :host {
        background: #1C1B1F !important;
        --ha-card-background: #1C1B1F !important;
        --card-background-color: #1C1B1F !important;
      }

      .info .label:first-child {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }

      .info .label.secondary {
        color: #8E8D8F;
      }

      .buttons {
        top: 220px;
        gap: 8px !important;
      }
    `;

    return {
      card_mod1: {
        style: {
          "ha-state-control-climate-temperature": {
            "$": {
              "ha-control-circular-slider": {
                "$": circularSliderStyle
              }
            }
          }
        }
      },

      card_mod2: {
        style: {
          "ha-state-control-climate-temperature": {
            "$": {
              "ha-control-circular-slider": {
                "$": circularSliderStyle
              }
            }
          }
        }
      },

      card_mod: {
        style: {
          ".": mainCardStyle,
          "ha-state-control-climate-temperature": {
            ".": climateRootStyle,
            "$": {
              ".buttons": {
                ".": buttonsStyle,
                "ha-outlined-icon-button": {
                  "$": outlinedButtonStyle
                },
                "ha-outlined-icon-button:first-child": {
                  "$": firstButtonStyle
                },
                "ha-outlined-icon-button:last-child": {
                  "$": lastButtonStyle
                }
              },
              "p.label.secondary ha-svg-icon": {
                "$": hideSecondaryIconStyle
              },
              "ha-big-number": {
                "$": bigNumberStyle
              },
              ".": climateMiscStyle
            }
          }
        }
      }
    };
  }
  normalizeThermostatObject(obj = {}) {
    const normalized = {
      type: "custom:dual-thermostat-card",
      entity1: "",
      entity2: "",
      name1: "Тёплый пол",
      name2: "Тёплый пол",
      base_path: "/local",
      power_icon: "/local/images/power.png",
      heat_icon: "/local/images/heat.png",
      cool_icon: "/local/images/cool.png",
      ...clone(obj)
    };

    const autoMods = buildDualThermostatCardMods(normalized);

    normalized.card_mod = deepMerge(autoMods.card_mod, normalized.card_mod || {});
    normalized.card_mod1 = deepMerge(autoMods.card_mod1, normalized.card_mod1 || {});
    normalized.card_mod2 = deepMerge(autoMods.card_mod2, normalized.card_mod2 || {});

    return normalized;
  }

  firstUpdated() {
    const mergeCardMod = (common, specific) => {
      if (!specific) return common;
      if (!common) return specific;

      const merged = JSON.parse(JSON.stringify(common));

      if (merged.style && specific.style) {
        merged.style = this.deepMerge(merged.style, specific.style);
      } else if (specific.style) {
        merged.style = specific.style;
      }

      Object.keys(specific).forEach(key => {
        if (key !== 'style') merged[key] = specific[key];
      });

      return merged;
    };

    this.card1 = document.createElement("hui-thermostat-card");
    this.card1.setConfig({
      entity: this.config.entity1,
      name: this.config.name1 || "Термостат 1",
      card_mod: mergeCardMod(this.config.card_mod, this.config.card_mod1)
    });

    this.card2 = document.createElement("hui-thermostat-card");
    this.card2.setConfig({
      entity: this.config.entity2,
      name: this.config.name2 || "Термостат 2",
      card_mod: mergeCardMod(this.config.card_mod, this.config.card_mod2)
    });

    this.updatePowerState();
    this.requestUpdate();

    const frame = this.shadowRoot.querySelector(".card");
    if (frame) {
      frame.addEventListener("pointerdown", this._onPointerDown.bind(this));
      frame.addEventListener("pointerup", this._onPointerUp.bind(this));
      frame.addEventListener("click", this._onClick.bind(this));
    }
  }
  _updateObject(index, patch) {
    const objects = [...(this._value?.objects || [])];
    const current = objects[index] || {};
    const updated = { ...current, ...patch };

    objects[index] = updated.type === "custom:dual-thermostat-card"
      ? this.normalizeThermostatObject(updated)
      : updated;

    this._value = { ...this._value, objects };
    fireEvent(this, "config-changed", { config: this._value });
  }
  _addThermostatCard() {
    const objects = [...(this._value?.objects || [])];
    objects.push(this.normalizeThermostatObject({
      type: "custom:dual-thermostat-card",
      entity1: "", entity2: "", name1: "Тёплый пол", name2: "Тёплый пол"
    }));
    this._value = { ...this._value, objects };
    fireEvent(this, "config-changed", { config: this._value });
  }

  updatePowerState() {
    if (!this._hass || !this.config?.entity1) return;
    const state = this._hass.states[this.config.entity1];
    this.powerOn = state ? state.state !== "off" : false;
  }

  // Tap / Hold / Double-tap
  _onPointerDown(e) {
    if (e.target.closest('.btn') || e.target.closest('.toggle')) return;
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
    if (e.target.closest('.btn') || e.target.closest('.toggle')) return;
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
      if (this._lastTap === now) this._performAction('tap');
    }, 320);
  }

  _performAction(actionType) {
    if (!this.hass || !this.config) return;
    handleAction(this, this.hass, this.config, actionType);
  }

  setMode(index) {
    if (this.active === index) return;
    this.active = index;
    this.requestUpdate();
  }

  togglePower(e) {
    e.stopPropagation();
    if (!this._hass || !this.config?.entity1) return;

    const isOff = this._hass.states[this.config.entity1]?.state === "off";
    const newPowerOn = !isOff;

    // Оптимистическое обновление
    this.powerOn = newPowerOn;

    this._hass.callService("climate", isOff ? "turn_on" : "turn_off", {
      entity_id: [this.config.entity1, this.config.entity2]
    });
  }

  render() {
    const thermo = this.active === 0 ? this.card1 : this.card2;

    return html`
      <div class="card">
        <div class="content">
          <div class="thermo-container">
            ${thermo}
          </div>
        </div>

        <div class="buttons">
          <!-- POWER BUTTON -->
          <div
            class="btn power ${this.powerOn ? 'active' : ''}"
            @click=${this.togglePower}>
            <img src="${this.config.power_icon || 'mdi:power'}">
          </div>

          <!-- TOGGLE -->
          <div class="toggle">
            <div class="slider ${this.active === 1 ? 'cool' : ''}"></div>

            <div class="toggle-btn heat-btn" 
                @click=${(e) => { e.stopPropagation(); this.setMode(0); }}>
              <img src="${this.config.heat_icon}">
            </div>

            <div class="toggle-btn cool-btn" 
                @click=${(e) => { e.stopPropagation(); this.setMode(1); }}>
              <img src="${this.config.cool_icon}">
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
/* EDITOR */

class DualThermostatCardEditor extends LitElement {
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

  setConfig(config) {  //здесь устанавливаются значения для визуального редактора, которые перезаписывают getStubConfig
    this._config = { entity1: "",
    name1: "Тёплый пол",
    entity2: "",
    name2: "Кондиционер",
    power_icon: `/local/images/power.png`,
    heat_icon: `/local/images/heat.png`,
    cool_icon: `/local/images/cool.png`,
    base_path: `/local`,
    ...config };//config перезаписывает, то что было сверху, берется из my-element.js метода _addCard
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
    return this._form([ //поля визуального редактора, их значения по умолчанию берутся из setConfig(config)
      { name: "entity1", required: true, selector: { entity: { domain: "climate" } } },
      { name: "name1", selector: { text: {} } },
      { name: "entity2", required: true, selector: { entity: { domain: "climate" } } },
      { name: "name2", selector: { text: {} } },
      { name: "power_icon", selector: { icon: {} }},
      { name: "heat_icon", selector: { icon: {} } },
      { name: "cool_icon", selector: { icon: {} } },
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
DualThermostatCard.getConfigElement = () => document.createElement("dual-thermostat-card-editor");

DualThermostatCard.getStubConfig = () => ({
  entity1: "",
  name1: "Тёплый пол",
  entity2: "",
  name2: "Кондиционер",
  power_icon: `${this.config.base_path}/images/power.png`,
  heat_icon: `${this.config.base_path}/images/heat.png`,
  cool_icon: `${this.config.base_path}/images/cool.png`,
  base_path: this.config.base_path,
});

customElements.define("dual-thermostat-card-editor", DualThermostatCardEditor);
customElements.define("dual-thermostat-card", DualThermostatCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom:dual-thermostat-card",
  name: "Dual Thermostat Card",
  description: "Два термостата с переключателем режимов",
  preview: true
});