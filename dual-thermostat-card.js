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
    powerOn: { type: Boolean },
    _cardReady: { state: true },
    _visible: { state: true }
  };

  constructor() {
    super();
    this.active = 0;
    this.powerOn = false;
    this._cardReady = false;
    this._visible = false;
    this._holdTimer = null;
    this._lastTap = 0;
    this.card1 = null;
    this.card2 = null;
  }

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

  setConfig(config) {
    this.config = {
      tap_action: { action: "more-info" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" },
      ...this.clone(config || {}),
    };

    const autoMods = this.buildDualThermostatCardMods(this.config);
    this.config.card_mod  = this.deepMerge(autoMods.card_mod,  this.config.card_mod  || {});
    this.config.card_mod1 = this.deepMerge(autoMods.card_mod1, this.config.card_mod1 || {});
    this.config.card_mod2 = this.deepMerge(autoMods.card_mod2, this.config.card_mod2 || {});

    this.base = this.config.base_path || "/local";

    this._buildCards();
  }

  set hass(hass) {
    this._hass = hass;
    if (this.card1) this.card1.hass = hass;
    if (this.card2) this.card2.hass = hass;
    this.updatePowerState();
    this.requestUpdate();
  }

  get hass() { return this._hass; }

  _buildCards() {
    if (!this.config?.entity1 || !this.config?.entity2) {
      this.card1 = null;
      this.card2 = null;
      this._cardReady = false;
      this.requestUpdate();
      return;
    }

    const mergeCardMod = (common, specific) => {
      if (!specific) return common;
      if (!common) return specific;
      const merged = this.clone(common);
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

    // Offscreen контейнер — карточки греются здесь пока card-mod не отработает
    if (!this._offscreen) {
      this._offscreen = document.createElement("div");
      this._offscreen.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:400px;visibility:hidden;pointer-events:none;";
      document.body.appendChild(this._offscreen);
    }

    try {
      const card1 = document.createElement("hui-thermostat-card");
      card1.setConfig({
        entity: this.config.entity1,
        name: this.config.name1 || "Термостат 1",
        card_mod: mergeCardMod(this.config.card_mod, this.config.card_mod1)
      });

      const card2 = document.createElement("hui-thermostat-card");
      card2.setConfig({
        entity: this.config.entity2,
        name: this.config.name2 || "Термостат 2",
        card_mod: mergeCardMod(this.config.card_mod, this.config.card_mod2)
      });

      if (this._hass) {
        card1.hass = this._hass;
        card2.hass = this._hass;
      }

      // Вставляем в offscreen — card-mod начинает работать
      this._offscreen.appendChild(card1);
      this._offscreen.appendChild(card2);

      this.card1 = card1;
      this.card2 = card2;
      this._cardReady = false; // не показываем пока не готово
      this._visible = false;
      this.updatePowerState();

      // Ждём пока card-mod отработает на обеих карточках
      Promise.all([
        this._waitForCardModReady(card1),
        this._waitForCardModReady(card2),
      ]).then(() => {
        this._cardReady = true;
        this.requestUpdate();
        // После того как Lit вставит карточку в основной DOM — показываем
        this.updateComplete.then(() => {
          requestAnimationFrame(() => requestAnimationFrame(() => {
            this._visible = true;
          }));
        });
      });

    } catch (e) {
      console.warn("dual-thermostat-card: ошибка создания карточки", e);
      this.card1 = null;
      this.card2 = null;
      this._cardReady = false;
      this.requestUpdate();
    }
  }

  _waitForCardModReady(card) {
    return new Promise((resolve) => {
      const deadline = Date.now() + 3000;

      const check = () => {
        if (Date.now() > deadline) { resolve(); return; }

        const shadow = card.shadowRoot;
        if (!shadow) { requestAnimationFrame(check); return; }

        const haCard = shadow.querySelector("ha-card");
        if (!haCard) { requestAnimationFrame(check); return; }

        // card-mod меняет background на наш цвет #1C1B1F = rgb(28, 27, 31)
        const bg = getComputedStyle(haCard).backgroundColor;
        if (bg === "rgb(28, 27, 31)") {
          resolve();
        } else {
          requestAnimationFrame(check);
        }
      };

      requestAnimationFrame(check);
    });
  }

  static styles = css`
    :host {
      display: block;
      max-width: 450px;
      min-width: 320px;
      width: 100%;
    }

    .card {
      width: 100%;
      box-sizing: border-box;
      border-radius: 24px;
      display: flex;
      flex-direction: column;
      cursor: pointer;
      user-select: none;
      position: relative;
      background-image:
        linear-gradient(#1C1B1F, #1C1B1F),
        linear-gradient(291.96deg, #4D4A54 0%, #1C1B1F 50%, #4D4A54 100%);
      border: 1px solid transparent;
      background-origin: border-box, border-box;
      background-clip: padding-box, border-box;
      padding-bottom: 24px;
    }

    .thermo-wrapper {
      overflow: hidden;
      border-radius: 24px 24px 0 0;
      flex: 1;
      opacity: 0;
      /* Нет transition — появление мгновенное, без анимации поверх старых стилей */
    }

    .thermo-wrapper.visible {
      opacity: 1;
    }

    .thermo-container {
      display: block;
      width: 100%;
    }

    .buttons {
      display: flex;
      justify-content: center;
      align-items: center; 
      gap: 12px;
      padding: 12px 16px 16px;
      background: #1C1B1F;
      border-radius: 0 0 24px 24px;
      border-top: 1px solid #1C1B1F;
      height: 64px;         /* ← фиксируем высоту блока = высоте toggle */
      box-sizing: border-box;
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
      flex-shrink: 0;       /* ← не сжимается */
    }
    .btn::before {
      content: "" !important;
      position: absolute !important;
      inset: 0 !important;
      padding: 1px !important;
      border-radius: inherit !important;
      background: linear-gradient(135deg, rgba(101,101,101,0) 0%, #656565 50%, rgba(101,101,101,0) 100%) !important;
      pointer-events: none !important;
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor !important;
      mask-composite: exclude !important;
    }
    .btn.power.active {
      background: #343239;
    }
    .btn img { width: 24px; height: 24px; }

    .toggle {
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
      background: linear-gradient(165deg, rgba(101,101,101,0) 0%, #656565 50%, rgba(101,101,101,0) 100%) !important;
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
    const entity1 = config.entity1;
    const entity2 = config.entity2;

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
        --control-circular-slider-background: rgba(255, 255, 255, 0.1) !important;
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
        border-radius: 24px 24px 0 0 !important;
        --ha-card-background: #1C1B1F !important;
        --card-background-color: #1C1B1F !important;
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
        border-radius: 0 !important;
        --ha-card-border-width: 0 !important;
        --ha-card-border-style: none !important;
        --ha-card-border-color: transparent !important;
        margin-bottom: 0 !important;
        padding-bottom: 0 !important;
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
          rgba(101,101,101,0) 0%,
          #656565 50%,
          rgba(101,101,101,0) 100%
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

    const makeFirstButtonStyle = (entity) => `
      .icon-button.outlined::after {
        content: "{{ state_attr('${entity}','min_temp')|round(0) }}°C";
        position: absolute;
        left: -35px;
        top: 30%;
        color: #8E8D8F;
        white-space: nowrap;
        text-align: center;
        font-family: Roboto;
        font-size: 16px;
        font-weight: 400;
        line-height: 20px;
      }
      #button { background: #323135 !important; }
    `;

    const makeLastButtonStyle = (entity) => `
      .icon-button.outlined::after {
        content: "{{ state_attr('${entity}','max_temp')|round(0) }}°C";
        position: absolute;
        right: -45px;
        top: 30%;
        color: #8E8D8F;
        white-space: nowrap;
        text-align: center;
        font-family: Roboto;
        font-size: 16px;
        font-weight: 400;
        line-height: 20px;
      }
      #button { background: #323135 !important; }
    `;
    const hideSecondaryIconStyle = `
      :host { display: none !important; }
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
      .info .label.secondary { color: #8E8D8F; }
      .buttons {
        top: 220px;
        gap: 8px !important;
      }
    `;

    const commonButtonsStyle = {
      style: {
        "ha-state-control-climate-temperature": {
          ".": climateRootStyle,
          "$": {
            ".buttons": {
              ".": buttonsStyle,
              "ha-outlined-icon-button": {
                "$": outlinedButtonStyle
              }
              // ← убрали first-child и last-of-type отсюда
            },
            "p.label.secondary ha-svg-icon": {
              "$": hideSecondaryIconStyle
            },
            "ha-big-number": {
              "$": bigNumberStyle
            },
            ".": climateMiscStyle
          }
        },
        ".": mainCardStyle
      }
    };

    // Фабрика card_mod для конкретного entity
    const makeEntityCardMod = (entity) => ({
      style: {
        "ha-state-control-climate-temperature": {
          "$": {
            ".buttons": {
              "ha-outlined-icon-button:first-child": {
                "$": makeFirstButtonStyle(entity)  // ← своя entity
              },
              "ha-outlined-icon-button:last-of-type": {
                "$": makeLastButtonStyle(entity)   // ← своя entity
              }
            },
            "ha-control-circular-slider": {
              "$": circularSliderStyle
            }
          }
        }
      }
    });
    return {
          card_mod: commonButtonsStyle,
          card_mod1: makeEntityCardMod(entity1),  // entity1 для card1
          card_mod2: makeEntityCardMod(entity2),  // entity2 для card2
        };
    
  }
  firstUpdated() {
    const frame = this.shadowRoot.querySelector(".card");
    if (frame) {
      frame.addEventListener("pointerdown", this._onPointerDown.bind(this));
      frame.addEventListener("pointerup", this._onPointerUp.bind(this));
      frame.addEventListener("click", this._onClick.bind(this));
    }

    this._waitForCardMod();
  }

  _waitForCardMod() {
    const card = this.active === 0 ? this.card1 : this.card2;
    if (!card) { this._visible = true; return; }

    const checkShadow = () => {
      const shadow = card.shadowRoot;
      if (!shadow) return false;
      // card-mod вставляет style с непустым содержимым
      const styles = shadow.querySelectorAll("style");
      for (const s of styles) {
        if (s.textContent && s.textContent.includes("#1C1B1F")) return true;
      }
      return false;
    };

    if (checkShadow()) {
      requestAnimationFrame(() => requestAnimationFrame(() => { this._visible = true; }));
      return;
    }

    const waitForShadow = (resolve) => {
      const card = this.active === 0 ? this.card1 : this.card2;
      if (!card) { resolve(); return; }
      if (card.shadowRoot) { resolve(card.shadowRoot); return; }
      // shadowRoot ещё не создан — ждём через customElements upgrade
      setTimeout(() => waitForShadow(resolve), 20);
    };

    waitForShadow((shadow) => {
      if (!shadow) { this._visible = true; return; }

      if (checkShadow()) {
        requestAnimationFrame(() => requestAnimationFrame(() => { this._visible = true; }));
        return;
      }

      const mo = new MutationObserver(() => {
        if (checkShadow()) {
          mo.disconnect();
          requestAnimationFrame(() => requestAnimationFrame(() => { this._visible = true; }));
        }
      });

      mo.observe(shadow, { childList: true, subtree: true, characterData: true });

      // Страховка
      setTimeout(() => {
        mo.disconnect();
        if (!this._visible) this._visible = true;
      }, 1000);
    });
  }

  updatePowerState() {
    if (!this._hass || !this.config?.entity1) return;
    const state = this._hass.states[this.config.entity1];
    this.powerOn = state ? state.state !== "off" : false;
  }

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
    this._visible = false;

    // Карточки уже прогрелись в offscreen — card-mod уже применён
    // Просто показываем
    this.requestUpdate();
    this.updateComplete.then(() => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        this._visible = true;
      }));
    });
  }

  _waitForCardRender() {
    const container = this.shadowRoot.querySelector(".thermo-container");
    if (!container) { this._visible = true; return; }

    // Текущая карточка могла уже иметь размер (кэш) — проверяем сразу
    if (container.getBoundingClientRect().height > 0) {
      requestAnimationFrame(() => requestAnimationFrame(() => { this._visible = true; }));
      return;
    }

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.height > 0) {
          ro.disconnect();
          requestAnimationFrame(() => requestAnimationFrame(() => { this._visible = true; }));
          return;
        }
      }
    });
    ro.observe(container);
    setTimeout(() => { if (!this._visible) { ro.disconnect(); this._visible = true; } }, 800);
  }

  togglePower(e) {
    e.stopPropagation();
    if (!this._hass || !this.config?.entity1) return;
    const isOff = this._hass.states[this.config.entity1]?.state === "off";
    this.powerOn = !isOff;
    this._hass.callService("climate", isOff ? "turn_on" : "turn_off", {
      entity_id: [this.config.entity1, this.config.entity2].filter(Boolean)
    });
  }

  render() {
    const thermo = this._cardReady
    ? (this.active === 0 ? this.card1 : this.card2)
    : null;

    return html`
      <div class="card">
        <div class="thermo-wrapper ${this._visible ? 'visible' : ''}">
          <div class="thermo-container">
            ${thermo
              ? thermo
              : html`<div style="padding:32px;color:#8E8D8F;text-align:center">
                  Выберите термостаты в настройках карточки
                </div>`
            }
          </div>
        </div>

        <div class="buttons">
          <div
            class="btn power ${this.powerOn ? 'active' : ''}"
            @click=${this.togglePower}>
            <img src="${this.config?.power_icon || `${this.base}/images/power.png`}">
          </div>

          <div class="toggle">
            <div class="slider ${this.active === 1 ? 'cool' : ''}"></div>
            <div class="toggle-btn heat-btn"
                @click=${(e) => { e.stopPropagation(); this.setMode(0); }}>
              <img src="${this.config?.heat_icon || `${this.base}/images/heat.png`}">
            </div>
            <div class="toggle-btn cool-btn"
                @click=${(e) => { e.stopPropagation(); this.setMode(1); }}>
              <img src="${this.config?.cool_icon || `${this.base}/images/cool.png`}">
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

/* ══════════════════════════════════════════
   EDITOR
══════════════════════════════════════════ */
const ICON_OPTIONS = [
  { label: "Спальня",        value: "/local/images/icons/bedroom.svg" },
  { label: "Гостиная",       value: "/local/images/icons/living_room.svg" },
  { label: "Душ, ванная",    value: "/local/images/icons/bathroom.svg" },
  { label: "Детская",        value: "/local/images/icons/kids_room.svg" }, //
  { label: "Гардероб",       value: "/local/images/icons/wardrobe.svg" }, //
  { label: "Кухня",          value: "/local/images/icons/kitchen.svg" },
  { label: "Котельная",      value: "/local/images/icons/boiler_room.svg" }, //
  { label: "Кабинет",        value: "/local/images/icons/office.svg" },
  { label: "Постирочная",    value: "/local/images/icons/laundry.svg" },
  { label: "Туалет",         value: "/local/images/icons/toilet.svg" },
  { label: "Холл",           value: "/local/images/icons/hall.svg" },
  { label: "Кладовая",       value: "/local/images/icons/storage.svg" }, //
  { label: "Коридор",        value: "/local/images/icons/corridor.svg" },
  { label: "Двор",           value: "/local/images/icons/yard.svg" },
  { label: "Баня, сауна",    value: "/local/images/icons/sauna.svg" }, //
  { label: "Столовая",       value: "/local/images/icons/dining_room.svg" },
  { label: "Кинотеатр",      value: "/local/images/icons/home_cinema.svg" },
  { label: "Бассейн",        value: "/local/images/icons/pool.svg" },
  { label: "Гараж",          value: "/local/images/icons/garage.svg" }, //
  { label: "Комната няни",   value: "/local/images/icons/nanny_room.svg" },
  { label: "Прихожая",       value: "/local/images/icons/entrance.svg" }, //
  { label: "Полумесяц",       value: "/local/images/icons/cresent_moon.svg" }, //
  { label: "Часы",       value: "/local/images/icons/clock.svg" }, //
  { label: "Холодный термостат",       value: "/local/images/icons/cool_thermostat.svg" }, //
  { label: "Горячий термостат",       value: "/local/images/icons/heat_thermostat.svg" }, //
  { label: "Дверь закрытая",       value: "/local/images/icons/door_front.svg" }, //
  { label: "Дверь открытая",       value: "/local/images/icons/door_open.svg" }, //
  { label: "Лампочка включенная",       value: "/local/images/icons/lightbulb.svg" }, //
  { label: "Лампочка выключенная",       value: "/local/images/icons/lightbulb_turnoff.svg" }, //
  { label: "Капля",       value: "/local/images/icons/no_drop.svg" }, //
  { label: "вкл/выкл",       value: "/local/images/icons/power.svg" }, //
];
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

  setConfig(config) {
    this._config = {
      entity1: "",
      name1: "Тёплый пол",
      entity2: "",
      name2: "Кондиционер",
      power_icon: "/local/images/power.png",
      heat_icon: "/local/images/heat.png",
      cool_icon: "/local/images/cool.png",
      base_path: "/local",
      ...config
    };
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
    const iconSelect = (label, key) => html`
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
        <div style="font-size:13px; font-weight:600; color:var(--primary-text-color); width:120px; flex-shrink:0;">${label}</div>
        ${this._config?.[key] ? html`
          <div style="
            width:40px; height:40px; border-radius:12px;
            background:#28272C; border:1px solid #4D4A54;
            display:flex; align-items:center; justify-content:center; flex-shrink:0;
          ">
            <img src=${this._config[key]} style="width:20px;height:20px;filter:brightness(0) invert(1);object-fit:contain;" />
          </div>
        ` : ''}
        <select
          style="flex:1; border:1px solid var(--divider-color); border-radius:10px; padding:10px 12px; background:var(--secondary-background-color); color:var(--primary-text-color); font:inherit; box-sizing:border-box;"
          @change=${(e) => this._setIcon(key, e.target.value)}
        >
          <option value="">— Выберите иконку —</option>
          ${ICON_OPTIONS.map(opt => html`
            <option value=${opt.value} ?selected=${this._config?.[key] === opt.value}>
              ${opt.label}
            </option>
          `)}
        </select>
      </div>
    `;

    return html`
      ${this._form([
        { name: "entity1", required: true, selector: { entity: { domain: "climate" } } },
        { name: "name1", selector: { text: {} } },
        { name: "entity2", required: true, selector: { entity: { domain: "climate" } } },
        { name: "name2", selector: { text: {} } },
        { name: "base_path", selector: { text: {} } }
      ])}

      <div style="margin-top:8px;">
        ${iconSelect("Иконка питания", "power_icon")}
        ${iconSelect("Иконка тепла", "heat_icon")}
        ${iconSelect("Иконка холода", "cool_icon")}
      </div>
    `;
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
  _setIcon = (key, value) => {
    this._config = { ...this._config, [key]: value };
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    }));
  };
  _valueChanged = (e) => {
    this._config = e.detail.value;
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    }));
  };
}


DualThermostatCard.getConfigElement = () => document.createElement("dual-thermostat-card-editor");

DualThermostatCard.getStubConfig = () => ({
  entity1: "",
  name1: "Тёплый пол",
  entity2: "",
  name2: "Кондиционер",
  power_icon: "/local/images/power.png",
  heat_icon: "/local/images/heat.png",
  cool_icon: "/local/images/cool.png",
  base_path: "/local",
});

customElements.define("dual-thermostat-card", DualThermostatCard);
customElements.define("dual-thermostat-card-editor", DualThermostatCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom:dual-thermostat-card",
  name: "Dual Thermostat Card",
  description: "Два термостата с переключателем режимов",
  preview: true,
  // ── Ключевое поле: без него HA не знает какой элемент открывать в редакторе
  documentationURL: "https://github.com/",
});