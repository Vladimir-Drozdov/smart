import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";

import {
  handleAction,
  hasAction
} from "https://unpkg.com/custom-card-helpers@2.0.0/dist/index.m.js?module";

class EmelyaMediaColumns extends LitElement {

  static properties = {
    hass: {},
    config: {},
    tvOn: { state: true },
    speakerOn: { state: true },
    volume: { state: true },
    showCircle: { type: Boolean }
  };

  constructor() {
    super();
    this.tvOn = false;
    this.speakerOn = false;
    this.volume = 70;
    this.showCircle = false;
    this._expectedTv = null;
    this._expectedSpeaker = null;
    this._holdTimer = null;
    this._lastTap = 0;
  }

  setConfig(config) {
    this.config = {
      tap_action: { action: "more-info" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" },
      ...config,
    };
    this.base = this.config.base_path || "/local";
  }

  set hass(hass) {
    this._hass = hass;

    // ТВ
    const tvEntity = this.config?.tv;
    if (tvEntity) {
      const tvState = hass.states?.[tvEntity];
      if (tvState) {
        const newTv = tvState.state !== "off";
        if (this._expectedTv !== null) {
          if (newTv === this._expectedTv) {
            this._expectedTv = null;
            this.tvOn = newTv;
            this.showCircle = newTv;
          }
        } else {
          this.tvOn = newTv;
          this.showCircle = newTv;
        }
      }
    }

    // Колонка Алиса
    const speakerEntity = this.config?.speaker;
    if (speakerEntity) {
      const speakerState = hass.states?.[speakerEntity];
      if (speakerState) {
        const newSpeaker = speakerState.state !== "off";
        if (this._expectedSpeaker !== null) {
          if (newSpeaker === this._expectedSpeaker) {
            this._expectedSpeaker = null;
            this.speakerOn = newSpeaker;
          }
        } else {
          this.speakerOn = newSpeaker;
        }

        const volume = speakerState.attributes?.volume_level;
        if (volume !== undefined) this.volume = Math.round(volume * 100);
      }
    }
  }

  get hass() {
    return this._hass;
  }

  static styles = css`
    :host { 
      display: block; 
      max-width: 320px; 
      width: 100%; 
      font-family: Roboto; 
      color: white; 
    }

    .wrapper {
      display: flex;
      gap: 8px;
      max-width: 320px;
      width: 100%;
    }
    .column {
      width:50%; 
      height:280px; 
      border-radius:24px; 
      padding:16px; 
      box-sizing:border-box;
      
      display:flex; 
      flex-direction:column; 
      justify-content:space-between;
      background-size:cover; 
      background-position:center; 
      background-repeat:no-repeat; 
      color:white;
      cursor: pointer;
      user-select: none;
    }
    .controls { display:flex; flex-direction:column; gap:8px; }
    .control {
      position: relative;
      border-radius: 16px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      cursor: pointer;
      transition: background 0.2s ease;
      background: rgba(255, 255, 255, 0.10);
    }

    .control::before {
      content: "";
      position: absolute;
      inset: 0;
      padding: 1px;
      border-radius: inherit;
      background: linear-gradient(
        135deg,
        rgba(101, 101, 101, 0) 0%,
        #656565 50%,
        rgba(101, 101, 101, 0) 100%
      );
      pointer-events: none;

      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
    }
    .control img {
      width: 24px; 
      height: 24px; 
      object-fit: contain;
    }
    .control.active { background: #E65332; }
    .title-wrapper {
      position: relative;
      display:inline-flex;
      align-items:center;
      width:50%;
      gap:8px;
      padding:6px 6px 6px 12px;
      background: #1C1B1F;
      border-radius:100px;
    }
    .title-wrapper::before {
      content: "";
      position: absolute;
      inset: 0;
      padding: 1px;
      border-radius: inherit;
      background: linear-gradient(135deg, rgba(101, 101, 101, 0) 0%, #656565 50%, rgba(101, 101, 101, 0) 100%);
      pointer-events: none;
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
    }
    .title { 
      font-size:20px; 
      font-weight:500; 
      color:white; 
    }
    .circle { 
      width:12px; 
      height:12px; 
      border-radius:50%; 
      background:#7FB800; 
      opacity:0; 
      visibility:hidden; 
      transition:opacity 0.2s; 
    }
    .circle.visible { 
      opacity:1; 
      visibility:visible; 
    }
    .alice { 
      top:-3%; 
      right:-8%; 
      position:absolute; 
      width:100%; 
      height:50%; 
    }
    .alice img { 
      width:100%; 
      height:100%; 
      object-fit:contain; 
    }
    .box { 
      height:56px; 
      width:100%; 
      background:transparent; 
      border-radius:16px;
      display:flex; 
      justify-content:center; 
      align-items:center; 
      gap:3px; 
      padding-bottom:5px;
    }
    .value { 
      width:100%; 
      font-size:60px; 
      text-align:center; 
      font-weight:600; 
    }
  `;

  _stopPropagation(e) {
    e.stopPropagation();
  }

  firstUpdated() {
    const wrapper = this.shadowRoot?.querySelector(".wrapper");
    if (!wrapper) return;

    wrapper.addEventListener("pointerdown", this._onPointerDown.bind(this));
    wrapper.addEventListener("pointerup", this._onPointerUp.bind(this));
    wrapper.addEventListener("click", this._onClick.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
  }

  _onPointerDown(e) {
    // Игнорируем клики по элементам управления
    if (e.target.closest('.control') || e.target.closest('.box')) return;

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
    if (e.target.closest('.control') || e.target.closest('.box')) return;

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

  // Действия
  toggleTv() {
    const newState = !this.tvOn;
    this.tvOn = newState;
    this.showCircle = newState;
    const entity = this.config?.tv;
    if (this.hass?.states?.[entity]) {
      this._expectedTv = newState;
      this.hass.callService("media_player", "toggle", { entity_id: entity });
    }
  }

  toggleSpeaker() {
    const newState = !this.speakerOn;
    this.speakerOn = newState;
    const entity = this.config?.speaker;
    if (this.hass?.states?.[entity]) {
      this._expectedSpeaker = newState;
      const service = newState ? "turn_on" : "turn_off";
      this.hass.callService("media_player", service, { entity_id: entity });
    }
  }

  openYoutube() {
    const entity = this.config?.tv;
    if (!entity || !this.hass?.states?.[entity]) return;
    this.hass.callService("media_player", "play_media", {
      entity_id: entity,
      media_content_type: "app",
      media_content_id: "youtube"
    });
  }

  openKinopoisk() {
    const entity = this.config?.tv;
    if (!entity || !this.hass?.states?.[entity]) return;
    this.hass.callService("media_player", "play_media", {
      entity_id: entity,
      media_content_type: "app",
      media_content_id: "kinopoisk"
    });
  }

  _fireMoreInfo(entityId) {
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      <div class="wrapper">
        <!-- ТВ -->
        <div class="column"
            style='
            background-image:
              linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #000000 100%),
              url("${this.base}/images/container-images/background-tv.png"),
              linear-gradient(135deg, rgba(101, 101, 101, 0.0) 0%, #656565 50%, rgba(101, 101, 101, 0.0) 100%);
            border: 1px solid transparent;
            background-size: auto, cover, auto;
            border-width: 1px;
            border-style: solid;
            background-origin: border-box;
            background-clip: padding-box, padding-box, border-box;
            '
            @click=${() => this._fireMoreInfo(this.config?.tv)}>

          <div class="title-wrapper">
              <div class="circle ${this.showCircle ? 'visible' : ''}"></div>
              <div class="title">ТВ</div>
          </div>

          <div class="controls">
            <div class="control" @pointerdown=${this._stopPropagation} @click=${e => { e.stopPropagation(); this.openKinopoisk(); }}>
              <img src="${this.base}/images/container-images/kinopoisk.png">
            </div>

            <div class="control" @pointerdown=${this._stopPropagation} @click=${e => { e.stopPropagation(); this.openYoutube(); }}>
              <img src="${this.base}/images/container-images/youtube.png">
            </div>

            <div class="control ${this.tvOn ? "active" : ""}" @pointerdown=${this._stopPropagation} @click=${e => { e.stopPropagation(); this.toggleTv(); }}>
              <img src="${this.base}/images/container-images/power_button.png">
            </div>
          </div>
        </div>

        <!-- Алиса колонка -->
        <div class="column"
            style='
            background-image:
              linear-gradient(180deg, #000000 0%, rgba(0, 0, 0, 0.4) 39.77%, #000000 100%),
              url("${this.base}/images/container-images/background-alice.png"),
              linear-gradient(135deg, rgba(101, 101, 101, 0) 0%, #656565 50%, rgba(101, 101, 101, 0) 100%);
            border: 1px solid transparent;
            background-size: auto, cover, auto;
            background-position: 0% 0%, center, 0% 0%;
            background-repeat: no-repeat;
            border-width: 1px;
            border-style: solid;
            background-origin: border-box;
            background-clip: padding-box, padding-box, border-box;
            position:relative; overflow:hidden;
            '
            @click=${() => this._fireMoreInfo(this.config?.speaker)}>

          <div class="alice">
              <img src="${this.base}/images/container-images/alice.png">
          </div>

          <div class="title" style="text-align:start; position:relative; z-index:2;">Колонка Алиса</div>

          <div>
            <div>
              <div style="font-size:12px;font-weight:700;width:100%; text-align:end; position:relative; z-index:2;">Громкость</div>
              <div style="width:100%; position:relative; z-index:2;">
                <div class="box" @click=${e=>{ e.stopPropagation(); this._fireMoreInfo(this.config?.speaker); }} style="z-index:2; position:relative;">
                  <div class="value">${this.volume}%</div>
                </div>
              </div>
            </div>

            <div class="control ${this.speakerOn ? "active" : ""}" @pointerdown=${this._stopPropagation} @click=${e=>{ e.stopPropagation(); this.toggleSpeaker(); }}>
              <img src="${this.base}/images/container-images/power_button.png">
            </div>
          </div>
        </div>

      </div>
    `;
  }
}

/* EDITOR */

class EmelyaMediaColumnsEditor extends LitElement {
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
        name: "tv", 
        required: true, 
        selector: { entity: { domain: "media_player" } } 
      },
      { 
        name: "speaker", 
        required: true, 
        selector: { entity: { domain: "media_player" } } 
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
EmelyaMediaColumns.getConfigElement = function () {
  return document.createElement("emelya-media-columns-editor");
};

EmelyaMediaColumns.getStubConfig = function () {
  return {
    tv: "",
    speaker: "",
    base_path: this.config.base_path,
  };
};

customElements.define("emelya-media-columns-editor", EmelyaMediaColumnsEditor);
customElements.define("emelya-media-columns", EmelyaMediaColumns);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom:emelya-media-columns",
  name: "Emelya Media Columns",
  description: "Колонки ТВ + Алиса",
  preview: false
});