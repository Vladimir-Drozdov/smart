import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";
import {
  handleAction,
  hasAction
} from "https://unpkg.com/custom-card-helpers@2.0.0/dist/index.m.js?module";

function clone(value) {
  return structuredClone(value);
}

// entity передаётся сюда, чтобы Jinja2-шаблоны card_mod
// реагировали на реальное состояние объекта в HA
const getCardMod = (base = "/local", entity = "") => ({
  style: {
    ".": `
      ha-card {
        --tile-color: #343239 !important;
        background: rgba(28, 27, 31, 1) !important;
        box-shadow: none !important;
        padding: 0px !important;
        border-radius: 24px !important;
      }
      ha-card:hover { background: transparent !important; }
      ha-card::before {
        content: "" !important;
        position: absolute !important;
        inset: 0 !important;
        padding: 1px !important;
        border-radius: inherit !important;
        background: linear-gradient(291.96deg, #4D4A54 0%, #1C1B1F 50%, #4D4A54 100%);
        pointer-events: none !important;
        -webkit-mask:
          linear-gradient(#fff 0 0) content-box,
          linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor !important;
        mask-composite: exclude !important;
      }

      ha-card ha-tile-container ha-tile-info {
        opacity:0 !important;
        visibility:hidden !important;
        display:none !important;
      }
      ha-card ha-tile-container ha-tile-icon{
        opacity:0 !important;
        visibility:hidden !important;
        display:none !important;
      }
      ha-card ha-tile-container ha-tile-icon ha-state-icon{
        display:none;
        opacity:0;
        visibility: hidden;
      }
      ha-card ha-tile-container ha-tile-icon[data-state="on"]{
        opacity:0 !important;
        visibility:hidden !important;
        display:none !important;
      }
      ha-card ha-tile-container ha-tile-icon::after{
        opacity:0 !important;
        visibility:hidden !important;
        display:none !important;
      }
      ha-card ha-tile-container ha-tile-icon::before {
        opacity:0 !important;
        visibility:hidden !important;
        display:none !important;
      }
      ha-card ha-tile-container ha-tile-info span:nth-child(2) {
        opacity:0 !important;
        visibility:hidden !important;
        display:none !important;
      }
      ha-card ha-tile-container ha-tile-info span:nth-child(3) {
        opacity:0 !important;
        visibility:hidden !important;
        display:none !important;
      }
      ha-card ha-tile-container hui-card-features {
        padding: 0 !important;
      }
    `,
    "ha-tile-container ha-tile-icon":{
      "$":`
        .container.background{
          opacity:0 !important;
          visibility:hidden !important;
          display:none !important;
        }
        .container{
          opacity:0 !important;
          visibility:hidden !important;
          display:none !important;
        }
      `
    },
    "ha-tile-container": {
      "$": `
        .content { 
          opacity:0 !important;
          visibility:hidden !important;
          display:none !important;
        }
      `,
      "ha-tile-info": {
        "$": `
          .info {
            opacity:0 !important;
            visibility:hidden !important;
            display:none !important;
          }
        `
      },

      "hui-card-features $": {
        "hui-card-feature $": {
          "hui-light-brightness-card-feature $":{
            // Jinja2 работает и во вложенных shadow-root строках card_mod
            "ha-control-slider $":`
              .slider{
                height: 64px !important;
                border-radius: 20px !important;
                background: #1C1B1F !important;
                position: relative !important;
              }
              .slider::before {
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
              .slider .slider-track-bar::after{
                right: 16px !important;
                --handle-margin: 16px !important;
              }
              .slider .slider-track-cursor::after{
                right: 16px !important;
                --handle-margin: 16px !important;
              }

              .container {
                height: 64px !important;
                border-radius: 20px !important;
              }
              .slider .slider-track-bar{
                height: 64px !important;
                border-radius: 20px !important;
                /* background управляется через JS динамически */
              }
            `,
            "." : `
              ha-control-slider {
                --control-slider-thickness: 64px !important;
                height: 64px !important;
                min-height: 64px !important;
                border-radius: 20px !important;
                --feature-border-radius: 20px !important;
                --control-slider-border-radius: 20px !important;
              }
              ha-control-slider::before {
                content: "" !important;
                position: absolute !important;
                inset: 0 !important;
                padding: 1px !important;
                border-radius: inherit !important;
                background: linear-gradient(292deg, #4D4A54 0%, #1C1B1F 50%, #4D4A54 100%);
                pointer-events: none !important;
                -webkit-mask:
                  linear-gradient(#fff 0 0) content-box,
                  linear-gradient(#fff 0 0);
                -webkit-mask-composite: xor !important;
                mask-composite: exclude !important;
              }`,
          },

          "hui-light-color-temp-card-feature $": {
            "ha-control-slider $": `
              .slider{
                height: 64px !important;
                border-radius: 20px !important;
                position: relative !important;
              }
              .slider::before {
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
              .slider .slider-track-bar::after{
                right: 16px !important;
                --handle-margin: 16px !important;
              }
              .slider .slider-track-cursor::after{
                right: 16px !important;
                --handle-margin: 16px !important;
              }
              .container {
                height: 64px !important;
                border-radius: 20px !important;
              }
              .slider .slider-track-bar{
                height: 64px !important;
                border-radius: 20px !important;
              }
            `,
            ".": `
              ha-control-slider {
                --control-slider-thickness: 64px !important;
                height: 64px !important;
                min-height: 64px !important;
                border-radius: 20px !important;
                --feature-border-radius: 20px !important;
                --control-slider-border-radius: 20px !important;
              }
              ha-control-slider::before {
                content: "" !important;
                position: absolute !important;
                inset: 0 !important;
                padding: 1px !important;
                border-radius: inherit !important;
                background: linear-gradient(292deg, #4D4A54 0%, #1C1B1F 50%, #4D4A54 100%);
                pointer-events: none !important;
                -webkit-mask:
                  linear-gradient(#fff 0 0) content-box,
                  linear-gradient(#fff 0 0);
                -webkit-mask-composite: xor !important;
                mask-composite: exclude !important;
              }
            `
          }
        }
      }
    }
  }
});

// entity передаётся в getCardMod — Jinja2-шаблоны знают за каким объектом следить
// supportedColorModes определяет какой слайдер показывать:
// - если лампа поддерживает brightness → только light-brightness
// - если нет brightness, но есть color_temp → только light-color-temp
function normalizeTileConfig(entity, base = "/local", hass = null) {
  let features = [{ type: "light-brightness" }];

  if (hass) {
    const stateObj = hass.states[entity];
    const modes = stateObj?.attributes?.supported_color_modes ?? [];
    // brightness доступна если есть хотя бы один режим кроме "onoff" и "unknown"
    const hasBrightness = modes.some(m => !["onoff", "unknown"].includes(m));
    if (!hasBrightness) {
      // нет brightness — пробуем color_temp
      const hasColorTemp = modes.includes("color_temp");
      features = hasColorTemp ? [{ type: "light-color-temp" }] : [];
    }
  }

  return {
    type: "tile",
    entity: entity,
    card_mod: getCardMod(base, entity),
    features
  };
}

/* ══════════════════════════════════════════
   MAIN CARD
══════════════════════════════════════════ */
class EmelyaLampCard extends LitElement {
  static properties = {
    hass: {},
    config: {},
    _sliderReady: { state: true }
  };

  static styles = css`
    :host {
      display: block;
      max-width:450px; min-width:320px;
      width: 100%;
      border-radius:24px;
    }
    ha-card{
      border-radius:24px !important;
      width: 100%;
      background: #1C1B1F;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 16px;
      cursor: pointer;
      user-select: none;
    }
    ha-card::before {
      content: "" !important;
      position: absolute !important;
      inset: 0 !important;
      padding: 1px !important;
      border-radius: inherit !important;
      background: linear-gradient(291.96deg, #4D4A54 0%, #1C1B1F 50%, #4D4A54 100%);
      pointer-events: none !important;
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor !important;
      mask-composite: exclude !important;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 16px 0;
      position: relative;
      z-index:1;
    }
    .card{
      width:100%;
      box-sizing:border-box;
      display:flex;
      flex-direction:column;
      justify-content:space-between;
      height:320px;
      border-radius:24px;
      color:white;
      cursor: pointer;
      user-select: none;
      position: relative;
      overflow: hidden;
      background: #1C1B1F;
    }
    .card::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 24px;
      background-image:
        linear-gradient(180deg, rgba(28, 27, 31, 0.00) 79.47%, #1C1B1F 95.8%),
        var(--card-bg, none), linear-gradient(0deg, #1C1B1F, #1C1B1F);
      background-size: auto, 83.125% 128.568%, auto;
      background-position: center, 60.5px 15.791px, center;
      background-repeat: no-repeat, no-repeat, no-repeat;
      background-blend-mode: normal, luminosity, normal;
      opacity: 0;
      transition: opacity 0.35s ease;
      pointer-events: none;
      z-index: 0;
    }
    .card.bg-loaded::after {
      opacity: 1;
    }
    .name {
      color: #fff;
      font-family: Roboto, sans-serif;
      font-size: 18px;
      font-weight: 600;
      line-height: 1.2;
    }

    .status {
      color: rgba(255,255,255,0.55);
      font-family: Roboto, sans-serif;
      font-size: 15px;
      font-weight: 400;
    }
    .status.on {
      color: rgba(255,255,255,0.85);
    }

    /* ── Footer ── */
    .footer {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0px 16px 16px 16px;
      position: relative;
      z-index: 2;
    }

    /* ── Power button ── */
    .power-btn {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #1C1B1F;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      position: relative;
      transition: background 0.2s ease;
    }
    .power-btn::before {
      content: "" !important;
      position: absolute !important;
      inset: 0 !important;
      padding: 1px !important;
      border-radius: inherit !important;
      background: linear-gradient(135deg, rgba(101, 101, 101, 0) 0%, #656565 50%, rgba(101, 101, 101, 0) 100%) !important;
      pointer-events: none !important;
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor !important;
      mask-composite: exclude !important;
    }
    .power-btn.on {
      background: #343239;
    }
    .power-btn img {
      width: 14px;
      height: 20px;
    }

    /* ── Slider wrapper ── */
    .slider-wrap {
      flex: 1;
      min-height: 64px;
      overflow: hidden;
      border-radius: 20px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .slider-wrap.ready {
      opacity: 1;
    }

    .slider-wrap ::slotted(ha-card) {
      width: 100% !important;
      display: block !important;
    }
  `;

  constructor() {
    super();
    this._sliderReady = false;
    this._sliderCard = null;
    this._buildToken = 0;
    this._lastBrightness = {};
    this._holdTimer = null;
    this._lastTap = 0;
    // Храним последнее известное состояние для обновления слайдера
    this._lastIsOn = null;
    this._preloadedBg = null;
  }

  setConfig(config) {
    this.config = {
      name: "Лампа",
      image: "",
      tap_action: { action: "none" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" },
      base_path: "/local",
      ...clone(config || {})
    };
    this.base = this.config.base_path || "/local";
    this._buildSliderCard();
    this._preloadBackground();
  }
  _preloadBackground() {
    const bg = this.config?.background_image || "";
    if (bg && this._preloadedBg !== bg) {
      this._preloadedBg = bg;
      const img = new Image();
      img.src = bg;
    }
  }

  get hass() { return this._hass; }

  set hass(hass) {
    // Сначала сохраняем brightness из старого hass (пока свет ещё "on")
    // Это критично: когда приходит новый hass с state:"off", brightness уже null
    this._saveBrightness(this._hass);
    // Из нового hass тоже сохраняем — если свет включён и brightness положительный
    this._saveBrightness(hass);
    this._hass = hass;

    if (this._sliderCard) {
      // Карточка находится в shadow root — обновляем hass прямо там.
      // _buildHassForCard патчит brightness когда свет выключен,
      // чтобы слайдер визуально не сбрасывался.
      this._sliderCard.hass = this._buildHassForCard(hass);
    }

    if (this._hass && !this._sliderCard && this.config?.entity) {
      this._buildSliderCard();
    }

    // Обновляем цвет slider-track-bar при смене состояния
    if (hass && this.config?.entity) {
      const isOn = hass.states[this.config.entity]?.state === "on";
      if (isOn !== this._lastIsOn) {
        this._lastIsOn = isOn;
        this._updateSliderTrackBarColor(isOn);
      }
    }

    this.requestUpdate();
  }

  _buildHassForCard(hass) {
    if (!hass || !this.config?.entity) return hass;
    const entityId = this.config.entity;
    const stateObj = hass.states[entityId];
    if (!stateObj) return hass;

    const savedBrightness = this._lastBrightness[entityId];
    if (savedBrightness == null) return hass;

    const needsInject =
      stateObj.state === "off" ||
      (stateObj.state === "on" && !(stateObj.attributes?.brightness > 0));

    if (!needsInject) return hass;

    return {
      ...hass,
      states: {
        ...hass.states,
        [entityId]: {
          ...stateObj,
          attributes: { ...stateObj.attributes, brightness: savedBrightness }
        }
      }
    };
  }

  _saveBrightness(hass) {
    if (!hass || !this.config?.entity) return;
    const stateObj = hass.states[this.config.entity];
    const brightness = stateObj?.attributes?.brightness;
    if (typeof brightness === "number" && brightness > 0) {
      this._lastBrightness[this.config.entity] = brightness;
    }
  }

  /**
  Обновляем background у .slider-track-bar напрямую в shadow DOM.
  */
  _updateSliderTrackBarColor(isOn) {
    const trackColor = isOn ? "#4D4A54" : "linear-gradient(270deg, #343239 0%, #1C1B1F 100%)";
    const sliderBg  = isOn ? "linear-gradient(90deg, #343239 50%, #1C1B1F 100%)" : "#1C1B1F";
    this._applyTrackBarColor(this._sliderCard, trackColor);
    this._applySliderBgColor(this._sliderCard, sliderBg);
  }

  _applyTrackBarColor(root, color, depth = 0) {
    if (!root || depth > 10) return;
    const sr = root.shadowRoot || root;
    sr.querySelectorAll(".slider-track-bar").forEach((el) => {
      el.style.setProperty("background", color, "important");
    });
    const children = sr.querySelectorAll ? sr.querySelectorAll("*") : [];
    children.forEach((el) => {
      if (el.shadowRoot) this._applyTrackBarColor(el, color, depth + 1);
    });
  }
  _applySliderBgColor(root, color, depth = 0) {
    if (!root || depth > 10) return;
    const sr = root.shadowRoot || root;
    sr.querySelectorAll(".slider").forEach((el) => {
      el.style.setProperty("background", color, "important");
    });
    sr.querySelectorAll("*").forEach((el) => {
      if (el.shadowRoot) this._applySliderBgColor(el, color, depth + 1);
    });
  }

  async _buildSliderCard() {
    const token = ++this._buildToken;
    this._sliderReady = false;
    this._sliderCard = null;

    if (!this._hass) {
      await new Promise((resolve) => {
        const check = () => { if (this._hass) resolve(); else setTimeout(check, 50); };
        check();
      });
      if (token !== this._buildToken) return;
    }

    if (!this.config?.entity) return;

    // Ждём первого рендера чтобы shadow root и [data-slider-mount] существовали
    await this.updateComplete;
    if (token !== this._buildToken) return;

    const wrap = this.shadowRoot?.querySelector("[data-slider-mount]");
    if (!wrap) return;

    // Очищаем старую карточку
    wrap.innerHTML = "";

    try {
      const helpers = await window.loadCardHelpers();
      if (token !== this._buildToken) return;

      const cfg = normalizeTileConfig(this.config.entity, this.base, this._hass);
      const card = await helpers.createCardElement(cfg);
      if (this._hass) card.hass = this._buildHassForCard(this._hass);

      // Вставляем СРАЗУ в финальный контейнер внутри shadow root.
      // card-mod работает здесь и элемент никуда не перемещается.
      wrap.appendChild(card);
      this._forceShowHandle(card);

      await this._waitForCardModReady(card);
      if (token !== this._buildToken) return;

      this._sliderCard = card;

      // Применяем начальный цвет трека сразу после построения карточки
      const isOn = this._hass?.states?.[this.config.entity]?.state === "on";
      this._lastIsOn = isOn;
      // Даём card_mod полностью отработать (двойной rAF + setTimeout),
      // затем принудительно ставим нужный цвет поверх
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setTimeout(() => {
          this._updateSliderTrackBarColor(isOn);
          this._watchTrackBarColor(card);
          this._sliderReady = true;
          this.requestUpdate();
        }, 50);
      }));

    } catch (err) {
      console.error("emelya-lamp-card: build error", err);
    }
  }

  /**
   * Вешаем MutationObserver на shadow-root каждого ha-control-slider.
   * При любом изменении атрибутов или дочерних узлов — принудительно
   * восстанавливаем нужный background через setProperty("background", color, "important").
   * Это гарантирует что ни card_mod, ни HA не смогут перезаписать цвет.
   */
  _watchTrackBarColor(card) {
    const getColor = () =>
      this._hass?.states?.[this.config?.entity]?.state === "on"
        ? "#4D4A54"
        : "linear-gradient(270deg, #343239 0%, #1C1B1F 100%)";

    const getSliderBg = () =>
        this._hass?.states?.[this.config?.entity]?.state === "on"
          ? "linear-gradient(90deg, #343239 50%, #1C1B1F 100%)"
          : "#1C1B1F";

    const applyToEl = (el) => {
      const color = getColor();
      el.style.setProperty("background", color, "important");
    };

    const applySliderBg = (el) => {
      el.style.setProperty("background", getSliderBg(), "important");
    };

    const observeShadow = (shadowRoot) => {
      shadowRoot.querySelectorAll(".slider-track-bar").forEach(applyToEl);
      shadowRoot.querySelectorAll(".slider").forEach(applySliderBg);

      const mo = new MutationObserver(() => {
        shadowRoot.querySelectorAll(".slider-track-bar").forEach(applyToEl);
        shadowRoot.querySelectorAll(".slider").forEach(applySliderBg);
      });
      mo.observe(shadowRoot, {
        attributes: true,
        subtree: true,
        attributeFilter: ["style", "class"],
        childList: true
      });
    };

    const findAndObserve = (root, depth = 0) => {
      if (!root || depth > 10) return;
      const sr = root.shadowRoot || root;
      sr.querySelectorAll?.("ha-control-slider").forEach((slider) => {
        const attach = () => {
          if (slider.shadowRoot) observeShadow(slider.shadowRoot);
          else requestAnimationFrame(attach);
        };
        attach();
      });
      sr.querySelectorAll?.("*").forEach((el) => {
        if (el.shadowRoot) findAndObserve(el, depth + 1);
      });
    };

    const waitCard = () => {
      if (card.shadowRoot) findAndObserve(card.shadowRoot);
      else requestAnimationFrame(waitCard);
    };
    requestAnimationFrame(waitCard);
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
        const bg = getComputedStyle(haCard).backgroundColor;
        if (bg === "rgb(28, 27, 31)") resolve();
        else requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
  }

  /**
   * Принудительно добавляем класс show-handle на slider-track-bar.
   * HA убирает этот класс когда state:"off", что меняет padding трека
   * и визуально сдвигает ползунок. Вешаем MutationObserver на каждый
   * ha-control-slider чтобы мгновенно возвращать класс при любом изменении DOM.
   */
  _forceShowHandle(card) {
    const applyClass = (root) => {
      if (!root) return;
      root.querySelectorAll(".slider-track-bar").forEach((el) => {
        if (!el.classList.contains("show-handle")) el.classList.add("show-handle");
      });
    };

    const observeCard = (shadowRoot) => {
      applyClass(shadowRoot);
      const mo = new MutationObserver((mutations) => {
        let needs = false;
        for (const m of mutations) {
          if (
            m.type === "attributes" &&
            m.attributeName === "class" &&
            m.target.classList.contains("slider-track-bar") &&
            !m.target.classList.contains("show-handle")
          ) {
            needs = true;
            break;
          }
        }
        if (needs) applyClass(shadowRoot);
      });
      mo.observe(shadowRoot, {
        attributes: true,
        subtree: true,
        attributeFilter: ["class"]
      });
    };

    const findSliders = (root, depth = 0) => {
      if (!root || depth > 8) return;
      root.querySelectorAll("ha-control-slider").forEach((slider) => {
        const wait = () => {
          if (slider.shadowRoot) observeCard(slider.shadowRoot);
          else requestAnimationFrame(wait);
        };
        wait();
      });
      root.querySelectorAll("*").forEach((el) => {
        if (el.shadowRoot) findSliders(el.shadowRoot, depth + 1);
      });
    };

    const waitCard = () => {
      if (card.shadowRoot) findSliders(card.shadowRoot);
      else requestAnimationFrame(waitCard);
    };
    requestAnimationFrame(waitCard);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  _togglePower(e) {
    e.stopPropagation();
    if (!this._hass || !this.config?.entity) return;
    const entityId = this.config.entity;
    const isOff = this._hass.states[entityId]?.state === "off";

    if (isOff) {
      const brightness = this._lastBrightness[entityId];
      const data = { entity_id: entityId };
      if (brightness != null) data.brightness = brightness;
      this._hass.callService("light", "turn_on", data);
    } else {
      const stateObj = this._hass.states[entityId];
      const brightness = stateObj?.attributes?.brightness;
      if (typeof brightness === "number" && brightness > 0) {
        this._lastBrightness[entityId] = brightness;
      }
      this._hass.callService("light", "turn_off", { entity_id: entityId });
    }
  }

  firstUpdated() {
    const card = this.shadowRoot?.querySelector(".card");
    if (!card) return;
    card.addEventListener("pointerdown", this._onPointerDown.bind(this));
    card.addEventListener("pointerup", this._onPointerUp.bind(this));
    card.addEventListener("click", this._onClick.bind(this));
    this._initCardBg();
  }
  _initCardBg() {
    const card = this.renderRoot?.querySelector(".card[data-bg]");
    if (!card) return;
    const bgUrl = card.dataset.bg;
    if (!bgUrl || card._bgInitialized === bgUrl) return;
    card._bgInitialized = bgUrl;
    card.style.setProperty("--card-bg", `url("${bgUrl}")`);
    const img = new Image();
    img.onload = () => card.classList.add("bg-loaded");
    img.src = bgUrl;
  }

  _onPointerDown(e) {
    if (e.target.closest(".power-btn") || e.target.closest(".slider-wrap")) return;
    if (hasAction(this.config, "hold_action")) {
      this._holdTimer = setTimeout(() => this._performAction("hold"), 500);
    }
  }
  _onPointerUp() {
    if (this._holdTimer) { clearTimeout(this._holdTimer); this._holdTimer = null; }
  }
  _onClick(e) {
    if (e.target.closest(".power-btn") || e.target.closest(".slider-wrap")) return;
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
    setTimeout(() => { if (this._lastTap === now) this._performAction("tap"); }, 320);
  }
  _performAction(type) {
    if (!this.hass || !this.config) return;
    handleAction(this, this.hass, this.config, type);
  }

  render() {
    const entityId = this.config?.entity;
    const stateObj = this._hass?.states?.[entityId];
    const isOn = stateObj?.state === "on";
    const name = this.config?.name || stateObj?.attributes?.friendly_name || "Лампа";
    const statusText = isOn ? "Включено" : "Выключено";
    const base = this.base || "/local";
    const bgImage = this.config?.background_image || "";

    return html`
    <ha-card>
      <div class="card" data-bg="${this.config?.background_image || ''}">

        <div class="header">
          <div class="name">${name}</div>
          <div class="status ${isOn ? 'on' : ''}">${statusText}</div>
        </div>

        <div class="footer">
          <div class="power-btn ${isOn ? 'on' : ''}" @click=${this._togglePower}>
            <img src="${base}/images/container-images/light_button.png" alt="power" />
          </div>

          <div
            class="slider-wrap ${this._sliderReady ? 'ready' : ''}"
            data-slider-mount
          ></div>
        </div>
      </div>
    </ha-card>
    `;
  }

  static async getConfigElement() {
    await customElements.whenDefined("emelya-lamp-card-editor");
    return document.createElement("emelya-lamp-card-editor");
  }

  static getStubConfig() {
    return {
      entity: "",
      name: "Лампа",
      image: "",
      background_image: "",
      base_path: "/local",
      tap_action: { action: "none" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" }
    };
  }
}

/* EDITOR */
class EmelyaLampCardEditor extends LitElement {
  static properties = {
    hass: {},
    _config: { state: true },
    _tab: { state: true },
    _bgUploadState: { state: true },
    _bgUploadError: { state: true },
    _bgDragOver: { state: true }
  };

  static styles = css`
    :host { display: block; box-sizing: border-box; }

    .tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .tab {
      padding: 8px 12px; border-radius: 10px;
      border: 1px solid var(--divider-color);
      background: var(--secondary-background-color);
      cursor: pointer; user-select: none;
    }
    .tab.active { background: var(--primary-color); color: white; border-color: var(--primary-color); }

    .img-field { display: flex; flex-direction: column; gap: 12px; }
    .img-label { font-size: 13px; font-weight: 600; color: var(--primary-text-color); }

    .img-preview {
      width: 100%; height: 160px; border-radius: 20px; overflow: hidden;
      background: #1C1B1F; border: 1px solid rgba(101,101,101,0.3);
      display: flex; align-items: center; justify-content: center;
    }
    .img-preview img { width: 120px; height: 120px; object-fit: contain; display: block; }
    .img-preview-empty {
      font-size: 12px; color: var(--secondary-text-color);
      text-align: center; padding: 16px; line-height: 1.5;
    }

    .drop-zone {
      width: 100%; box-sizing: border-box; min-height: 96px;
      border: 2px dashed var(--divider-color); border-radius: 16px;
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 8px; padding: 16px; cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      background: var(--secondary-background-color); text-align: center;
    }
    .drop-zone.dragover {
      border-color: var(--primary-color);
      background: color-mix(in srgb, var(--primary-color) 10%, transparent);
    }
    .drop-zone.loading { opacity: 0.6; pointer-events: none; }

    .drop-icon { font-size: 28px; line-height: 1; }
    .drop-text { font-size: 13px; color: var(--primary-text-color); line-height: 1.4; }
    .drop-sub  { font-size: 11px; color: var(--secondary-text-color); }

    .drop-btn {
      margin-top: 4px; padding: 6px 14px; border-radius: 8px;
      border: 1px solid var(--primary-color); background: transparent;
      color: var(--primary-color); font-size: 13px; cursor: pointer;
      transition: background 0.15s;
    }
    .drop-btn:hover { background: color-mix(in srgb, var(--primary-color) 15%, transparent); }

    .status-row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .status-row.success { color: var(--success-color, #43a047); }
    .status-row.error   { color: var(--error-color, #db4437); }

    .current-path {
      display: flex; align-items: center; gap: 8px; font-size: 12px;
      color: var(--secondary-text-color); background: var(--secondary-background-color);
      border: 1px solid var(--divider-color); border-radius: 10px;
      padding: 8px 10px; box-sizing: border-box;
    }
    .current-path span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .path-clear {
      width: 24px; height: 24px; border: none; border-radius: 6px;
      background: transparent; color: var(--secondary-text-color);
      cursor: pointer; font-size: 14px; display: flex;
      align-items: center; justify-content: center; flex-shrink: 0; transition: color 0.15s;
    }
    .path-clear:hover { color: var(--error-color, #db4437); }

    input[type="file"] { display: none; }
  `;

  constructor() {
    super();
    this._tab = 0;
    this._bgUploadState = "idle";
    this._bgUploadError = "";
    this._bgDragOver = false;
  }

  setConfig(config) {
    this._config = {
      entity: "",
      name: "Лампа",
      image: "",
      base_path: "/local",
      tap_action: { action: "none" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" },
      ...clone(config || {})
    };
  }

  render() {
    if (!this._config) return html``;
    return html`
      <div class="tabs">
        ${["Объект", "Внешний вид", "Взаимодействия"].map((label, i) => html`
          <div class="tab ${this._tab === i ? "active" : ""}" @click=${() => this._tab = i}>
            ${label}
          </div>
        `)}
      </div>
      ${this._tab === 0 ? this._objectTab() : ""}
      ${this._tab === 1 ? this._appearanceTab() : ""}
      ${this._tab === 2 ? this._actionsTab() : ""}
    `;
  }

  _objectTab() {
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${[
          { name: "entity", label: "Светильник", required: true, selector: { entity: { domain: "light" } } },
          { name: "name", label: "Название", selector: { text: {} } },
          { name: "base_path", label: "Путь к ресурсам", selector: { text: {} } }
        ]}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  _appearanceTab() {
    const bgSrc = this._config?.background_image;
    return html`
      <div class="img-field">
        <div class="img-label">Фоновое изображение карточки</div>

        <div class="img-preview">
          ${bgSrc ? html`
            <img
              src=${bgSrc}
              alt="bg preview"
              @error=${() => { this._bgUploadState = "error"; this._bgUploadError = "Файл не найден"; }}
            />
          ` : html`
            <div class="img-preview-empty">Фон не задан.<br>Будет использован однотонный фон.</div>
          `}
        </div>

        <div
          class="drop-zone ${this._bgDragOver ? "dragover" : ""} ${this._bgUploadState === "loading" ? "loading" : ""}"
          @dragover=${this._onBgDragOver}
          @dragleave=${this._onBgDragLeave}
          @drop=${this._onBgDrop}
          @click=${this._onBgZoneClick}
        >
          <div class="drop-icon">${this._bgUploadState === "loading" ? "⏳" : "🌄"}</div>
          <div class="drop-text">${this._bgUploadState === "loading" ? "Загрузка..." : "Перетащите фон сюда"}</div>
          <div class="drop-sub">PNG, JPG, WebP, AVIF, SVG</div>
          ${this._bgUploadState !== "loading" ? html`
            <button class="drop-btn" @click=${this._onBgZoneClick}>Выбрать файл</button>
          ` : ""}
        </div>

        <input type="file" id="bgFileInput" accept="image/*" @change=${this._onBgFileInput} />

        ${this._bgUploadState === "success" ? html`<div class="status-row success">✓ Фон загружен</div>` : ""}
        ${this._bgUploadState === "error"   ? html`<div class="status-row error">⚠ ${this._bgUploadError}</div>` : ""}

        ${bgSrc ? html`
          <div class="current-path">
            <span title=${bgSrc}>${bgSrc}</span>
            <button class="path-clear" @click=${this._clearBgImage}>✕</button>
          </div>
        ` : ""}
      </div>
    `;
  }

  _actionsTab() {
    return html`
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
    `;
  }

  /* Drag & Drop для фона */

  _onBgDragOver(e) { e.preventDefault(); this._bgDragOver = true; }
  _onBgDragLeave()  { this._bgDragOver = false; }

  _onBgDrop(e) {
    e.preventDefault();
    this._bgDragOver = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) this._uploadBgFile(file);
  }

  _onBgZoneClick(e) {
    e.stopPropagation();
    this.shadowRoot?.getElementById("bgFileInput")?.click();
  }

  _onBgFileInput(e) {
    const file = e.target?.files?.[0];
    if (file) this._uploadBgFile(file);
    e.target.value = "";
  }
  _normalizeFileForUpload(file) {
    const unsupportedByHA = ["image/avif", "image/jxl", "image/heic", "image/heif"];
    if (unsupportedByHA.includes(file.type)) {
      return new File([file], file.name, { type: "image/png" });
    }
    return file;
  }

  async _uploadBgFile(file) {
    if (!file.type.startsWith("image/")) {
      this._bgUploadState = "error";
      this._bgUploadError = "Файл не является изображением";
      return;
    }

    this._bgUploadState = "loading";
    this._bgUploadError = "";
    const uploadFile = this._normalizeFileForUpload(file);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const resp = await this.hass.fetchWithAuth(
        `/api/config/core/store_image`,
        { method: "POST", body: formData }
      );

      if (resp.ok) {
        const json = await resp.json();
        this._setBackgroundImage(json.url || `/local/${file.name}`);
        this._bgUploadState = "success";
        return;
      }
    } catch (_) {}

    try {
      const token = this.hass?.auth?.data?.access_token;
      const formData = new FormData();
      formData.append("file", uploadFile);

      const resp = await fetch(`${window.location.origin}/api/image/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (resp.ok) {
        const json = await resp.json();
        const imgPath = `/api/image/serve/${json.id}/original`;
        this._setBackgroundImage(imgPath);
        this._bgUploadState = "success";
        return;
      }

      throw new Error(`HTTP ${resp.status}`);
    } catch (err) {
      this._bgUploadState = "error";
      this._bgUploadError = `Не удалось загрузить файл (${err.message}).`;
    }
  }

  _setBackgroundImage(path) {
    this._config = { ...this._config, background_image: path };
    this._fire();
  }

  _clearBgImage() {
    this._bgUploadState = "idle";
    this._bgUploadError = "";
    const config = { ...this._config };
    delete config.background_image;
    this._config = config;
    this._fire();
  }

  _valueChanged = (e) => {
    this._config = { ...this._config, ...e.detail.value };
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

/* REGISTER */
customElements.define("emelya-lamp-card-editor", EmelyaLampCardEditor);

if (!customElements.get("emelya-lamp-card")) {
  customElements.define("emelya-lamp-card", EmelyaLampCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.find(c => c.type === "custom:emelya-lamp-card")) {
  window.customCards.push({
    type: "custom:emelya-lamp-card",
    name: "Emelya Lamp Card",
    description: "Карточка лампы с изображением и слайдером яркости",
    preview: true
  });
}