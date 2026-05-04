import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";
import {
  handleAction,
  hasAction
} from "https://unpkg.com/custom-card-helpers@2.0.0/dist/index.m.js?module";

function clone(value) {
  return structuredClone(value);
}

const getCardMod = (base = "/local") => ({
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
                background: #343239 !important;
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

          "hui-light-color-temp-card-feature $": `
            ha-control-slider {
              --control-slider-thickness: 64px !important;
              height: 64px !important;
              min-height: 64px !important;
            }
            ha-control-slider .container,
            ha-control-slider .slider,
            ha-control-slider .slider .slider-track-bar {
              height: 64px !important;
              border-radius: 20px !important;
            }

            ha-control-slider .slider .slider-track-bar::after,
            ha-control-slider .slider .slider-track-cursor::after {
              right: 16px !important;
              width: 4px !important;
              background: rgba(255,255,255,0.7) !important;
              opacity: 1 !important;
            }
          `
        }
      }
    }
  }
});

function normalizeTileConfig(entity, base = "/local") {
  return {
    type: "tile",
    entity: entity,
    card_mod: getCardMod(base),
    features: [{ type: "light-brightness" }]
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
      max-width: 450px;
      min-width: 320px;
      width: 100%;
    }

    .card {
      position: relative;
      width: 100%;
      border-radius: 24px;
      overflow: hidden;
      background: #1C1B1F;
      box-sizing: border-box;
      background-image:
        linear-gradient(#1C1B1F, #1C1B1F),
        linear-gradient(291.96deg, #4D4A54 0%, #1C1B1F 50%, #4D4A54 100%);
      border: 1px solid transparent;
      background-origin: border-box, border-box;
      background-clip: padding-box, border-box;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 16px 0;
      position: relative;
      z-index: 2;
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

    /* ── Image area ── */
    .image-area {
      position: relative;
      width: 100%;
      height: 180px;
      overflow: hidden;
    }

    .device-image {
      position: absolute;
      right: -10px;
      bottom: -10px;
      width: 75%;
      height: 100%;
      object-fit: contain;
      object-position: right bottom;
      pointer-events: none;
      user-select: none;
    }

    /* ── Footer ── */
    .footer {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px 16px;
      background: #1C1B1F;
      position: relative;
      z-index: 2;
    }

    /* ── Power button (стиль из файла 2) ── */
    .power-btn {
      width: 64px;
      height: 64px;
      border-radius: 16px;
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
      height: 64px;
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
      height: 64px !important;
      display: block !important;
    }
  `;

  constructor() {
    super();
    this._sliderReady = false;
    this._sliderCard = null;
    this._buildToken = 0;
    this._lastBrightness = {};
    this._offscreen = null;
    this._holdTimer = null;
    this._lastTap = 0;
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
  }

  get hass() { return this._hass; }

  set hass(hass) {
    this._saveBrightness(this._hass);
    this._saveBrightness(hass);
    this._hass = hass;

    if (this._sliderCard) {
      this._sliderCard.hass = this._buildHassForCard(hass);
    }

    if (this._hass && !this._sliderCard && this.config?.entity) {
      this._buildSliderCard();
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

  async _buildSliderCard() {
    const token = ++this._buildToken;
    this._sliderReady = false;

    if (!this._hass) {
      await new Promise((resolve) => {
        const check = () => { if (this._hass) resolve(); else setTimeout(check, 50); };
        check();
      });
      if (token !== this._buildToken) return;
    }

    if (!this.config?.entity) return;

    if (!this._offscreen) {
      this._offscreen = document.createElement("div");
      this._offscreen.style.cssText =
        "position:fixed;left:-9999px;top:-9999px;width:400px;visibility:hidden;pointer-events:none;";
      document.body.appendChild(this._offscreen);
    }

    try {
      const helpers = await window.loadCardHelpers();
      if (token !== this._buildToken) return;

      const cfg = normalizeTileConfig(this.config.entity, this.base);
      const card = await helpers.createCardElement(cfg);
      if (this._hass) card.hass = this._buildHassForCard(this._hass);

      this._offscreen.appendChild(card);
      this._forceShowHandle(card);

      await this._waitForCardModReady(card);
      if (token !== this._buildToken) return;

      this._sliderCard = card;
      this.requestUpdate();

      await this.updateComplete;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        this._sliderReady = true;
      }));

    } catch (err) {
      console.error("emelya-lamp-card: build error", err);
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
        const bg = getComputedStyle(haCard).backgroundColor;
        if (bg === "rgb(28, 27, 31)") resolve();
        else requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
  }

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
          if (m.type === "attributes" && m.attributeName === "class" &&
            m.target.classList.contains("slider-track-bar") &&
            !m.target.classList.contains("show-handle")) {
            needs = true; break;
          }
        }
        if (needs) applyClass(shadowRoot);
      });
      mo.observe(shadowRoot, { attributes: true, subtree: true, attributeFilter: ["class"] });
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
    if (this._offscreen) { this._offscreen.remove(); this._offscreen = null; }
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
    const image = this.config?.image || "";
    const base = this.base || "/local";

    return html`
      <div class="card">
        <div class="header">
          <div class="name">${name}</div>
          <div class="status ${isOn ? 'on' : ''}">${statusText}</div>
        </div>

        <div class="image-area">
          ${image ? html`<img class="device-image" src="${image}" alt="${name}" />` : html``}
        </div>

        <div class="footer">
          <div class="power-btn ${isOn ? 'on' : ''}" @click=${this._togglePower}>
            <img src="${base}/images/container-images/light_button.png" alt="power" />
          </div>

          <div class="slider-wrap ${this._sliderReady ? 'ready' : ''}">
            ${this._sliderCard ?? html``}
          </div>
        </div>
      </div>
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
      base_path: "/local",
      tap_action: { action: "none" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" }
    };
  }
}

/* ══════════════════════════════════════════
   EDITOR
══════════════════════════════════════════ */
class EmelyaLampCardEditor extends LitElement {
  static properties = {
    hass: {},
    _config: { state: true },
    _tab: { state: true },
    _uploadState: { state: true },
    _uploadError: { state: true },
    _dragOver: { state: true }
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

    .img-hint { font-size: 12px; color: var(--secondary-text-color); line-height: 1.6; }
    .img-hint code {
      background: var(--secondary-background-color); border: 1px solid var(--divider-color);
      border-radius: 4px; padding: 1px 5px; font-size: 11px;
    }

    input[type="file"] { display: none; }
  `;

  constructor() {
    super();
    this._tab = 0;
    this._uploadState = "idle";
    this._uploadError = "";
    this._dragOver = false;
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
    const src = this._config?.image;
    return html`
      <div class="img-field">
        <div class="img-label">Изображение устройства</div>

        <div class="img-preview">
          ${src ? html`
            <img
              src=${src}
              alt="preview"
              @error=${() => { this._uploadState = "error"; this._uploadError = "Файл не найден"; }}
            />
          ` : html`
            <div class="img-preview-empty">Изображение не задано.<br>Карточка будет без картинки.</div>
          `}
        </div>

        <div
          class="drop-zone ${this._dragOver ? "dragover" : ""} ${this._uploadState === "loading" ? "loading" : ""}"
          @dragover=${this._onDragOver}
          @dragleave=${this._onDragLeave}
          @drop=${this._onDrop}
          @click=${this._onZoneClick}
        >
          <div class="drop-icon">${this._uploadState === "loading" ? "⏳" : "🖼️"}</div>
          <div class="drop-text">${this._uploadState === "loading" ? "Загрузка..." : "Перетащите изображение сюда"}</div>
          <div class="drop-sub">PNG, JPG, WebP, SVG</div>
          ${this._uploadState !== "loading" ? html`
            <button class="drop-btn" @click=${this._onZoneClick}>Выбрать файл</button>
          ` : ""}
        </div>

        <input type="file" id="fileInput" accept="image/*" @change=${this._onFileInput} />

        ${this._uploadState === "success" ? html`<div class="status-row success">✓ Изображение загружено</div>` : ""}
        ${this._uploadState === "error"   ? html`<div class="status-row error">⚠ ${this._uploadError}</div>` : ""}

        ${src ? html`
          <div class="current-path">
            <span title=${src}>${src}</span>
            <button class="path-clear" @click=${this._clearImage}>✕</button>
          </div>
        ` : ""}

        <div class="img-hint">
          Файл сохраняется в <code>config/www/</code> и доступен по пути <code>/local/имя_файла</code>.
        </div>
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

  _onDragOver(e) { e.preventDefault(); this._dragOver = true; }
  _onDragLeave()  { this._dragOver = false; }

  _onDrop(e) {
    e.preventDefault();
    this._dragOver = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) this._uploadFile(file);
  }

  _onZoneClick(e) {
    e.stopPropagation();
    this.shadowRoot?.getElementById("fileInput")?.click();
  }

  _onFileInput(e) {
    const file = e.target?.files?.[0];
    if (file) this._uploadFile(file);
    e.target.value = "";
  }

  async _uploadFile(file) {
    if (!file.type.startsWith("image/")) {
      this._uploadState = "error";
      this._uploadError = "Файл не является изображением";
      return;
    }

    this._uploadState = "loading";
    this._uploadError = "";

    try {
      const formData = new FormData();
      formData.append("file", file);

      const resp = await this.hass.fetchWithAuth(
        `/api/config/core/store_image`,
        { method: "POST", body: formData }
      );

      if (resp.ok) {
        const json = await resp.json();
        this._setImage(json.url || `/local/${file.name}`);
        this._uploadState = "success";
        return;
      }
    } catch (_) {}

    try {
      const token = this.hass?.auth?.data?.access_token;
      const formData = new FormData();
      formData.append("file", file);

      const resp = await fetch(`${window.location.origin}/api/image/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (resp.ok) {
        const json = await resp.json();
        const imgPath = `/api/image/serve/${json.id}/original`;
        this._setImage(imgPath);
        this._uploadState = "success";
        return;
      }

      throw new Error(`HTTP ${resp.status}`);
    } catch (err) {
      this._uploadState = "error";
      this._uploadError = `Не удалось загрузить файл (${err.message}). Поместите файл вручную в config/www/ и укажите путь.`;
    }
  }

  _setImage(path) {
    this._config = { ...this._config, image: path };
    this._fire();
  }

  _clearImage() {
    this._uploadState = "idle";
    this._uploadError = "";
    const config = { ...this._config };
    delete config.image;
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

/* ══════════════════════════════════════════
   REGISTER
══════════════════════════════════════════ */
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