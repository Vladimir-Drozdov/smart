// /config/www/emelya-header-card.js
import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function fireMoreInfo(element, entityId) {
  element.dispatchEvent(new CustomEvent("hass-more-info", {
    detail: { entityId },
    bubbles: true,
    composed: true,
  }));
}

function handleAction(element, hass, config, actionConfig) {
  if (!actionConfig) return;
  const action = actionConfig.action || "none";
  if (action === "navigate") {
    const path = actionConfig.navigation_path || "/";
    history.pushState(null, "", path);
    element.dispatchEvent(new CustomEvent("location-changed", {
      detail: { replace: false },
      bubbles: true,
      composed: true,
    }));
  } else if (action === "url") {
    const url = actionConfig.url_path || "";
    window.open(url, actionConfig.url_path_target || "_blank");
  } else if (action === "call-service" || action === "perform-action") {
    const [domain, service] = (actionConfig.perform_action || actionConfig.service || "").split(".");
    if (domain && service) {
      hass.callService(domain, service, actionConfig.data || actionConfig.service_data || {});
    }
  } else if (action === "fire-dom-event") {
    element.dispatchEvent(new CustomEvent("ll-custom", {
      detail: actionConfig,
      bubbles: true,
      composed: true,
    }));
  }
  // "none" → do nothing
}

/* ─────────────────────────────────────────
   CARD
───────────────────────────────────────── */
class EmelyaHeaderCard extends LitElement {

  static properties = {
    hass: {},
    config: {},
  };

  constructor() {
    super();
    this._temp = 24;
    this._onlinePersons = [];
    this._allPersons   = [];
    this._mode = localStorage.getItem("home_mode") || "home";
    this._holdTimer = null;
    this._tapCount  = 0;
    this._tapTimer  = null;

    window.addEventListener("home-mode-changed", () => {
      const saved = localStorage.getItem("home_mode");
      if (saved) { this._mode = saved; this.requestUpdate(); }
    });
  }

  setConfig(config) {
    this.config = config;
    this.base = config.base_path || "/local";
    this._weatherIcon = `${this.base}/images/rain.png`;
    this._allPersons = config.person_entities
      ? (Array.isArray(config.person_entities) ? config.person_entities : [config.person_entities])
      : (config.person_entity ? [config.person_entity] : []);
  }

  set hass(hass) {
    this._hass = hass;

    // PERSONS
    this._onlinePersons = this._allPersons.filter(id => {
      const s = hass.states?.[id];
      return s && s.state === "home";
    });

    // WEATHER
    const weather = hass.states?.[this.config?.weather_entity];
    if (weather) {
      const temp = weather.attributes?.temperature;
      this._temp = temp !== undefined ? Math.round(temp) : this._temp;
      this._weatherIcon = this._mapWeather(weather.state);
    }

    // MODE FROM SCRIPTS
    const scripts = [
      { entity: "script.arrive_home",  mode: "home"  },
      { entity: "script.leave_home",   mode: "away"  },
      { entity: "script.night_mode",   mode: "night" },
    ];
    let lastTime = 0, newMode = null;
    scripts.forEach(s => {
      const obj = hass.states?.[s.entity];
      if (!obj) return;
      const t = new Date(obj.attributes?.last_triggered || 0).getTime();
      if (t > lastTime) { lastTime = t; newMode = s.mode; }
    });
    if (newMode) {
      this._mode = newMode;
      localStorage.setItem("home_mode", newMode);
    } else {
      const saved = localStorage.getItem("home_mode");
      if (saved) this._mode = saved;
    }

    this.requestUpdate();
  }

  /* ── Styles ── */
  static styles = css`
    :host { display: block; }

    .outer {
      border-radius: 24px;
      border: 1px solid rgba(101,101,101,0.35);
    }

    .wrapper {
      height: 120px;
      padding: 24px;
      box-sizing: border-box;
      width: 100%;
      display: flex;
      flex-direction: column;
      border-radius: 24px;
      position: relative;
      overflow: hidden;
    }

    /* Dark gradient overlay rendered as a pseudo-element so it never
       conflicts with the user-supplied background image. */
    .wrapper::before {
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

    .row {
      position: relative; /* above ::before */
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 100%;
    }

    .left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    /* ── Avatars ── */
    .avatars {
      display: flex;
      flex-direction: row;
      flex-shrink: 0;
    }

    .avatar-wrapper {
      position: relative;
      width: 64px;
      height: 64px;
      border-radius: 96px;
      border: 1px solid rgba(101,101,101,0.50);
      margin-left: -12px;
      background-color: rgba(0,0,0,0.20);
      background-size: 84.375% 84.375%;
      background-position: 5.158px 12.108px;
      background-repeat: no-repeat;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .avatar-wrapper:hover { opacity: 0.8; }
    .avatars .avatar-wrapper:first-child { margin-left: 0; }

    .online-dot {
      position: absolute;
      bottom: 3px;
      right: 3px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #7FB800;
    }

    /* ── Text ── */
    .text-block {
      align-items: start;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .title {
      font-size: 32px;
      font-weight: 600;
      color: #FFFFFF;
      line-height: 40px;
      font-family: Roboto, sans-serif;
    }

    .subtitle {
      padding: 0; margin: 0;
      font-size: 12px;
      color: rgba(255,255,255,0.8);
      text-align: left;
    }

    /* ── Right ── */
    .right {
      display: flex;
      align-items: center;
      flex-direction: column;
    }

    .logo { width: 96px; height: 40px; }

    .weather {
      margin-top: 10px;
      width: 100%;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      color: white;
    }

    .temp, .weather-icon-wrap {
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .temp:hover, .weather-icon-wrap:hover { opacity: 0.75; }

    .temp { font-size: 16px; font-weight: 600; }

    .weather-icon-wrap img { display: block; }

    /* ── Responsive ── */
    @container (max-width: 480px) {
      .left {
        margin-top: -2px;
        flex-direction: column-reverse;
        align-items: flex-start;
      }
      .wrapper { height: 210px; }
      .weather { gap: 8px; margin-top: 0; width: 100%; }
      .weather * { margin: 0; }
      .logo { width: 80px; height: 33px; }
      .logo img { width: 100%; height: 100%; object-fit: contain; }
      .right {
        justify-content: space-between;
        align-items: flex-end;
        height: 100%;
        margin: 0; padding: 0;
      }
      .temp, .weather-icon-wrap {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 64px;
        height: 64px;
        background: #000000;
        border-radius: 50%;
        margin: 0; padding: 0;
      }
    }
  `;

  /* ── Helpers ── */
  _mapWeather(condition) {
    const map = {
      rainy:        `${this.base}/images/rain.png`,
      pouring:      `${this.base}/images/rain.png`,
      cloudy:       `${this.base}/images/cloud.svg`,
      sunny:        `${this.base}/images/sun.svg`,
      clear:        `${this.base}/images/sun.svg`,
      partlycloudy: `${this.base}/images/cloud.svg`,
    };
    return map[condition] || `${this.base}/images/rain.png`;
  }

  _getModeText() {
    const map = {
      home:  "Все устройства переведены в режим «Мы пришли»",
      away:  "Все устройства переведены в режим «Никого нет дома»",
      night: "Все устройства переведены в режим «Ночной режим»",
    };
    return map[this._mode] || "";
  }

  /* ── Tap / Hold handling for the card itself ── */
  _onPointerDown(e) {
    this._holdTimer = setTimeout(() => {
      this._holdTimer = null;
      handleAction(this, this._hass, this.config, this.config?.hold_action);
    }, 500);
  }

  _onPointerUp(e) {
    if (!this._holdTimer) return; // hold already fired
    clearTimeout(this._holdTimer);
    this._holdTimer = null;

    this._tapCount = (this._tapCount || 0) + 1;
    if (this._tapCount === 1) {
      this._tapTimer = setTimeout(() => {
        this._tapCount = 0;
        handleAction(this, this._hass, this.config, this.config?.tap_action);
      }, 300);
    } else if (this._tapCount === 2) {
      clearTimeout(this._tapTimer);
      this._tapCount = 0;
      handleAction(this, this._hass, this.config, this.config?.double_tap_action);
    }
  }

  _onPointerCancel() {
    clearTimeout(this._holdTimer);
    this._holdTimer = null;
  }

  /* ── Avatar click → more-info ── */
  _onAvatarClick(e, entityId) {
    e.stopPropagation();
    if (entityId && entityId !== "__offline__") {
      fireMoreInfo(this, entityId);
    }
  }

  /* ── Weather click → more-info ── */
  _onWeatherClick(e) {
    e.stopPropagation();
    const weatherEntity = this.config?.weather_entity;
    if (weatherEntity) fireMoreInfo(this, weatherEntity);
  }

  /* ── Render ── */
  _renderAvatar(entityId, isOnline) {
    const personImg = `${this.base}/images/person.png`;
    return html`
      <div
        class="avatar-wrapper"
        style="background-image: url('${personImg}');"
        @click=${(e) => this._onAvatarClick(e, entityId)}
        title="${entityId}"
      >
        ${isOnline ? html`<div class="online-dot"></div>` : ""}
      </div>
    `;
  }

  render() {
    // Fix: set background-image directly on .wrapper via style attribute
    const bgUrl = this.config?.background_image || `${this.base}/images/header-bg.png`;

    const showOnline = this._onlinePersons.length > 0;
    const avatarsToRender = showOnline
      ? this._onlinePersons.map(id => ({ id, online: true }))
      : [{ id: "__offline__", online: false }];

    return html`
      <div class="outer">
        <div
          class="wrapper"
          style='
            background: linear-gradient(180deg, rgba(28, 27, 31, 0.00) 75%, #1C1B1F 100%), url("${bgUrl}") 0px -329.447px / 100% 457.197% no-repeat;
            border: none;
            border-radius: 24px !important;
          '
          @pointerdown=${this._onPointerDown}
          @pointerup=${this._onPointerUp}
          @pointercancel=${this._onPointerCancel}
        >
          <div class="row">
            <div class="left">
              <div class="avatars">
                ${avatarsToRender.map(a => this._renderAvatar(a.id, a.online))}
              </div>
              <div class="text-block">
                <div class="title">Дома</div>
                <div class="subtitle">${this._getModeText()}</div>
              </div>
            </div>

            <div class="right">
              <div class="logo">
                <img src="${this.base}/images/emelya-title.png">
              </div>
              <div class="weather">
                <div class="temp" @click=${this._onWeatherClick}>${this._temp}°</div>
                <div class="weather-icon-wrap" @click=${this._onWeatherClick}>
                  <img src="${this._weatherIcon}">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

/* ─────────────────────────────────────────
   EDITOR
───────────────────────────────────────── */
class EmelyaHeaderCardEditor extends LitElement {
  static properties = {
    hass:    {},
    _config: { state: true },
    _tab:    { state: true },
  };

  static styles = css`
    :host { display: block; box-sizing: border-box; }

    .tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }

    .tab {
      padding: 8px 14px;
      border-radius: 10px;
      border: 1px solid var(--divider-color);
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
    }

    .tab.active {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }

    .person-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .person-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .person-row ha-selector { flex: 1; }

    .icon-btn {
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      border-radius: 10px;
      width: 34px; height: 34px;
      cursor: pointer;
      font-size: 14px;
      flex-shrink: 0;
    }

    .add-btn {
      align-self: flex-start;
      border: none;
      border-radius: 10px;
      padding: 8px 14px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      background: var(--primary-color);
      color: white;
      margin-top: 2px;
    }

    .divider {
      height: 1px;
      background: var(--divider-color);
      border: none;
      margin: 4px 0;
    }

    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: var(--secondary-text-color);
      margin-bottom: 4px;
    }
  `;

  constructor() {
    super();
    this._tab = 0;
    this._config = {};
  }

  setConfig(config) {
    this._config = { ...config };
    if (!this._config.person_entities) {
      this._config.person_entities = this._config.person_entity
        ? [this._config.person_entity]
        : [""];
    }
  }

  get _persons() {
    return Array.isArray(this._config.person_entities)
      ? this._config.person_entities
      : [""];
  }

  _emit() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: { ...this._config } },
      bubbles: true,
      composed: true,
    }));
  }

  _addPerson() {
    const persons = [...this._persons, ""];
    this._config = { ...this._config, person_entities: persons };
    this._emit();
  }

  _removePerson(index) {
    const persons = this._persons.filter((_, i) => i !== index);
    this._config = { ...this._config, person_entities: persons.length ? persons : [""] };
    this._emit();
  }

  _onPersonChange(index, e) {
    const value = e.detail?.value ?? e.target?.value ?? "";
    const persons = [...this._persons];
    persons[index] = value;
    this._config = { ...this._config, person_entities: persons };
    this._emit();
  }

  _valueChanged = (e) => {
    this._config = e.detail.value;
    this._emit();
  };

  /* ── Tabs ── */
  _renderTabs() {
    const tabs = ["Объект", "Взаимодействия"];
    return html`
      <div class="tabs">
        ${tabs.map((t, i) => html`
          <div
            class="tab ${this._tab === i ? "active" : ""}"
            @click=${() => { this._tab = i; }}
          >${t}</div>
        `)}
      </div>
    `;
  }

  /* ── Tab 0: Entity settings ── */
  _objectTab() {
    const persons = this._persons;
    return html`
      <div class="section-title">Пользователи</div>
      <div class="person-list">
        ${persons.map((entityId, index) => html`
          <div class="person-row">
            <ha-selector
              .hass=${this.hass}
              .value=${entityId}
              .selector=${{ entity: { domain: ["person", "device_tracker"] } }}
              @value-changed=${(e) => this._onPersonChange(index, e)}
            ></ha-selector>
            <button
              class="icon-btn"
              title="Удалить"
              ?disabled=${persons.length === 1 && !entityId}
              @click=${() => this._removePerson(index)}
            >✕</button>
          </div>
        `)}
        <button class="add-btn" @click=${this._addPerson}>+ Добавить пользователя</button>
      </div>

      <hr class="divider">

      <div class="section-title">Погода</div>
      <ha-selector
        .hass=${this.hass}
        .value=${this._config.weather_entity || ""}
        .selector=${{ entity: { domain: ["weather"] } }}
        @value-changed=${(e) => {
          this._config = { ...this._config, weather_entity: e.detail.value };
          this._emit();
        }}
      ></ha-selector>

      <hr class="divider">

      <div class="section-title">Пути к файлам</div>
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${[
          {
            name: "base_path",
            label: "Base path",
            selector: { text: {} },
          },
          {
            name: "background_image",
            label: "Фоновое изображение (URL или /local/...)",
            selector: { text: {} },
          },
        ]}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  /* ── Tab 1: Actions ── */
  _actionsTab() {
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${[
          {
            name: "tap_action",
            label: this.hass?.localize?.("ui.panel.lovelace.editor.card.generic.tap_action") || "При нажатии",
            selector: { ui_action: {} },
          },
          {
            name: "hold_action",
            label: this.hass?.localize?.("ui.panel.lovelace.editor.card.generic.hold_action") || "При удержании",
            selector: { ui_action: {} },
          },
          {
            name: "double_tap_action",
            label: this.hass?.localize?.("ui.panel.lovelace.editor.card.generic.double_tap_action") || "При двойном нажатии",
            selector: { ui_action: {} },
          },
        ]}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  render() {
    if (!this._config) return html``;
    return html`
      ${this._renderTabs()}
      ${this._tab === 0 ? this._objectTab() : ""}
      ${this._tab === 1 ? this._actionsTab() : ""}
    `;
  }
}

/* ─────────────────────────────────────────
   REGISTRATION
───────────────────────────────────────── */
EmelyaHeaderCard.getConfigElement = function () {
  return document.createElement("emelya-header-card-editor");
};

EmelyaHeaderCard.getStubConfig = function () {
  return {
    person_entities:   [""],
    weather_entity:    "",
    base_path:         "/local",
    background_image:  "",
    tap_action:        { action: "none" },
    hold_action:       { action: "none" },
    double_tap_action: { action: "none" },
  };
};

if (!customElements.get("emelya-header-card-editor")) {
  customElements.define("emelya-header-card-editor", EmelyaHeaderCardEditor);
}

if (!customElements.get("emelya-header-card")) {
  customElements.define("emelya-header-card", EmelyaHeaderCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.find(c => c.type === "custom:emelya-header-card")) {
  window.customCards.push({
    type:        "custom:emelya-header-card",
    name:        "Emelya Header Card",
    description: "Шапка дашборда с погодой и статусом пользователей",
    preview:     true,
  });
}