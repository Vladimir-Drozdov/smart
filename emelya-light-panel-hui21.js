import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";
import {
  handleAction,
  hasAction
} from "https://unpkg.com/custom-card-helpers@2.0.0/dist/index.m.js?module";
/* MAIN CARD */
class EmelyaLightPanelHui extends LitElement {
  static properties = {
    hass: {},
    config: {},
    power: { state: true }
  };

  static styles = css`
    :host {
      display: block;
      max-width: 450px;
      min-width: 320px;
      width: 100%;
      border-radius: 24px;
      border: none !important;
    }

    ha-card {
      position: relative;
      overflow: hidden;
      border-radius: 24px !important;
      border: none !important;
      width: 100%;
      background: #1c1b1f;
      padding: 16px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 16px;
      cursor: pointer;
      user-select: none;
    }

    ha-card::before {
      content: "";
      position: absolute;
      inset: 0;
      padding: 1px;
      border-radius: inherit;
      background: linear-gradient(
        291.96deg,
        #4d4a54 0%,
        #1c1b1f 50%,
        #4d4a54 100%
      );
      pointer-events: none;
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
    }

    .header {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .power-button {
      width: 64px;
      height: 64px;
      background: #343239;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s ease;
      flex-shrink: 0;
      position: relative;
    }

    .power-button::before {
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

    .power-button.on {
      background: #e65332;
    }

    .power-button img {
      width: 22px;
      height: 22px;
      object-fit: contain;
    }

    .text-wrap {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .title {
      color: #fff;
      font-size: 18px;
      font-weight: 600;
      line-height: 1.2;
    }

    .subtitle {
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
      line-height: 1.2;
    }

    .tile-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .light-tile {
      position: relative;
      overflow: hidden;
      border-radius: 22px;
      padding: 10px 12px;
      background: linear-gradient(
        180deg,
        rgba(31, 30, 37, 0.98) 0%,
        rgba(24, 24, 30, 0.98) 100%
      );
      cursor: pointer;
      transition: transform 0.15s ease, opacity 0.15s ease;
    }

    .light-tile::before {
      content: "";
      position: absolute;
      inset: 0;
      padding: 1px;
      border-radius: inherit;
      background: linear-gradient(
        135deg,
        rgba(92, 88, 102, 0.7) 0%,
        rgba(55, 53, 61, 0.25) 45%,
        rgba(92, 88, 102, 0.7) 100%
      );
      pointer-events: none;
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
    }

    .light-tile:active {
      transform: scale(0.995);
    }

    .light-tile.unavailable {
      opacity: 0.6;
    }

    .tile-main {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .lamp-box {
      width: 52px;
      height: 52px;
      min-width: 52px;
      border-radius: 16px;
      background: #2f2d35;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      flex-shrink: 0;
    }

    .lamp-box::before {
      content: "";
      position: absolute;
      inset: 0;
      padding: 1px;
      border-radius: inherit;
      background: linear-gradient(
        135deg,
        rgba(112, 108, 122, 0.15) 0%,
        rgba(112, 108, 122, 0.8) 50%,
        rgba(112, 108, 122, 0.15) 100%
      );
      pointer-events: none;
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
    }

    .lamp-icon {
      width: 22px;
      height: 22px;
      object-fit: contain;
      filter: brightness(0) invert(1);
      opacity: 0.92;
    }

    .tile-copy {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .tile-title {
      color: #ffffff;
      font-family: Roboto, sans-serif;
      font-size: 18px;
      font-weight: 600;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tile-subtitle {
      color: rgba(255, 255, 255, 0.58);
      font-family: Roboto, sans-serif;
      font-size: 15px;
      font-weight: 400;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .light-tile.with-bar {
      padding-bottom: 12px;
    }

    .light-bar {
      position: relative;
      margin-top: 12px;
      height: 58px;
      border-radius: 18px;
      overflow: hidden;
      background: linear-gradient(
        90deg,
        rgba(53, 51, 60, 0.98) 0%,
        rgba(31, 30, 37, 0.98) 100%
      );
      cursor: pointer;
    }

    .light-bar::before {
      content: "";
      position: absolute;
      inset: 0;
      padding: 1px;
      border-radius: inherit;
      background: linear-gradient(
        135deg,
        rgba(112, 108, 122, 0.35) 0%,
        rgba(112, 108, 122, 0.12) 50%,
        rgba(112, 108, 122, 0.35) 100%
      );
      pointer-events: none;
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
    }

    .light-bar-fill {
      position: absolute;
      inset: 0 auto 0 0;
      width: 0%;
      height: 100%;
      border-radius: 18px;
      background: linear-gradient(
        90deg,
        rgba(100, 96, 109, 0.95) 0%,
        rgba(82, 79, 90, 0.95) 100%
      );
      transition: width 0.2s ease;
    }

    .light-bar-handle {
      position: absolute;
      top: 50%;
      width: 4px;
      height: 26px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.95);
      transform: translate(-50%, -50%);
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.18);
      pointer-events: none;
    }

    .empty {
      color: rgba(255, 255, 255, 0.55);
      text-align: center;
      padding: 14px 10px;
      border: 1px dashed rgba(255, 255, 255, 0.12);
      border-radius: 16px;
    }
    .light-bar {
      position: relative;
      margin-top: 12px;
      height: 58px;
      border-radius: 18px;
      overflow: hidden;
      background: linear-gradient(90deg, rgba(53,51,60,0.98) 0%, rgba(31,30,37,0.98) 100%);
      padding: 0 16px;           /* отступы слева и справа */
      display: flex;
      align-items: center;
    }

    .native-slider {
      width: 100%;
      height: 6px;
      background: transparent;
      outline: none;
      -webkit-appearance: none;
      pointer-events: auto;
    }

    /* Трек (фон) */
    .native-slider::-webkit-slider-runnable-track {
      width: 100%;
      height: 6px;
      background: linear-gradient(90deg, rgba(100,96,109,0.95) 0%, rgba(82,79,90,0.95) 100%);
      border-radius: 999px;
      cursor: pointer;
    }

    .native-slider::-moz-range-track {
      width: 100%;
      height: 6px;
      background: linear-gradient(90deg, rgba(100,96,109,0.95) 0%, rgba(82,79,90,0.95) 100%);
      border-radius: 999px;
      cursor: pointer;
    }

    /* Ползунок */
    .native-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: 26px;
      width: 26px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 0 10px rgba(255,255,255,0.3);
      margin-top: -10px;
    }

    .native-slider::-moz-range-thumb {
      height: 26px;
      width: 26px;
      background: rgba(255, 255, 255, 0.95);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 0 10px rgba(255,255,255,0.3);
    }
  `;

  constructor() {
    super();
    this.power = true;
    this._holdTimer = null;
    this._lastTap = 0;
  }

  setConfig(config) {
    if (!config) config = {};

    this.config = {
      title: "Освещение",
      subtitle: "Мастер-выключатель",
      tiles: [],
      tap_action: { action: "none" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" },
      ...JSON.parse(JSON.stringify(config))
    };

    // Простая нормализация
    this.config.tiles = (this.config.tiles || []).map((tile) => ({
      entity: tile?.entity || "",
      name: tile?.name || "",
      ...tile
    }));

    this._syncPowerState();
  }

  get hass() {
    return this._hass;
  }

  set hass(hass) {
    this._hass = hass;
    this._syncPowerState();
    this.requestUpdate();
  }

  _syncPowerState() {
    if (!this._hass) return;

    const entityIds = (this.config?.tiles || [])
      .map((tile) => tile?.entity)
      .filter(Boolean);

    if (!entityIds.length) {
      this.power = true;
      return;
    }

    this.power = entityIds.some((entityId) => {
      const stateObj = this._hass.states[entityId];
      return (
        stateObj &&
        stateObj.state !== "off" &&
        stateObj.state !== "unavailable" &&
        stateObj.state !== "unknown"
      );
    });
  }

  _lightEntities() {
    return (this.config?.tiles || [])
      .map((tile) => tile?.entity)
      .filter(Boolean);
  }

  _getTiles() {
    return (this.config?.tiles || []).filter((tile) => tile?.entity);
  }

  _getStateObj(tile) {
    if (!this._hass || !tile?.entity) return undefined;
    return this._hass.states[tile.entity];
  }

  _isUnavailable(stateObj) {
    return !stateObj || ["unavailable", "unknown"].includes(stateObj.state);
  }

  _isOn(stateObj) {
    return !!stateObj && !["off", "unavailable", "unknown"].includes(stateObj.state);
  }

  _hasBar(tile) {
    // По умолчанию показываем бар яркости. 
    // Если хочешь отключить для конкретной плитки — добавь в конфиг tile: { mode: "toggle" }
    return tile?.mode !== "toggle";
  }

  _getBrightnessPercent(stateObj) {
    const raw = Number(stateObj?.attributes?.brightness ?? 0);
    if (!raw || raw < 0) return 0;
    return Math.round((raw / 255) * 100);
  }

  _getTileName(tile, stateObj) {
    return tile?.name || stateObj?.attributes?.friendly_name || tile?.entity || "Светильник";
  }

  _getTileSubtitle(tile, stateObj) {
    if (this._isUnavailable(stateObj)) return "Недоступно";

    if (this._hasBar(tile)) {
      const pct = this._isOn(stateObj) ? this._getBrightnessPercent(stateObj) : 0;
      return `${pct}%`;
    }
    return this._isOn(stateObj) ? "Включено" : "Выключено";
  }

  togglePower(e) {
    e.stopPropagation();

    if (!this._hass) return;

    const entities = this._lightEntities();
    if (!entities.length) return;

    const shouldTurnOn = !this.power;
    this.power = shouldTurnOn;

    this._hass.callService("light", shouldTurnOn ? "turn_on" : "turn_off", {
      entity_id: entities
    });
  }

  _toggleTile(tile, e) {
    e.stopPropagation();

    if (!this._hass || !tile?.entity) return;

    const stateObj = this._getStateObj(tile);
    if (this._isUnavailable(stateObj)) return;

    this._hass.callService("light", "toggle", {
      entity_id: tile.entity
    });
  }

  _setBarValue(tile, e) {
    e.stopPropagation();

    if (!this._hass || !tile?.entity) return;

    const stateObj = this._getStateObj(tile);
    if (this._isUnavailable(stateObj)) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const brightness_pct = Math.round(ratio * 100);

    if (brightness_pct <= 0) {
      this._hass.callService("light", "turn_off", {
        entity_id: tile.entity
      });
      return;
    }

    this._hass.callService("light", "turn_on", {
      entity_id: tile.entity,
      brightness_pct
    });
  }
  _setBarValueNative(tile, e) {
    e.stopPropagation();
    if (!this._hass || !tile?.entity) return;

    const value = parseInt(e.target.value, 10);

    if (value <= 5) {
      this._hass.callService("light", "turn_off", { entity_id: tile.entity });
    } else {
      this._hass.callService("light", "turn_on", {
        entity_id: tile.entity,
        brightness_pct: value
      });
    }
  }

  _renderTile(tile) {
    const stateObj = this._getStateObj(tile);
    const hasBar = this._hasBar(tile);
    const isOn = this._isOn(stateObj);
    const isUnavailable = this._isUnavailable(stateObj);
    const brightness = this._getBrightnessPercent(stateObj);

    return html`
      <div
        class="light-tile ${hasBar ? "with-bar" : ""} ${isUnavailable ? "unavailable" : ""}"
        @click=${(e) => this._toggleTile(tile, e)}
      >
        <div class="tile-main">
          <div class="lamp-box">
            <img class="lamp-icon" src="/local/images/lights/light_bulb.png" alt="Light" />
          </div>
          <div class="tile-copy">
            <div class="tile-title">${this._getTileName(tile, stateObj)}</div>
            <div class="tile-subtitle">${this._getTileSubtitle(tile, stateObj)}</div>
          </div>
        </div>

        ${hasBar ? html`
          <div class="light-bar">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              .value=${isOn ? brightness : 0}
              @input=${(e) => this._setBarValueNative(tile, e)}
              @change=${(e) => this._setBarValueNative(tile, e)}
              class="native-slider"
            />
          </div>
        ` : ""}
      </div>
    `;
  }

  firstUpdated() {
    const frame = this.shadowRoot?.querySelector("ha-card");
    if (!frame) return;

    frame.addEventListener("pointerdown", this._onPointerDown.bind(this));
    frame.addEventListener("pointerup", this._onPointerUp.bind(this));
    frame.addEventListener("click", this._onClick.bind(this));
  }

  _onPointerDown(e) {
    if (e.target.closest(".power-button") || e.target.closest(".native-slider")) return;
    if (e.target.closest(".power-button")) return;
    if (e.target.closest(".tile-container")) return;

    if (hasAction(this.config, "hold_action")) {
      this._holdTimer = setTimeout(() => this._performAction("hold"), 500);
    }
  }

  _onPointerUp() {
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
  }

  _onClick(e) {
    if (e.target.closest(".power-button") || e.target.closest(".native-slider") || e.target.closest(".light-tile")) return;
    if (e.target.closest(".power-button")) return;
    if (e.target.closest(".tile-container")) return;

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
      if (this._lastTap === now) this._performAction("tap");
    }, 320);
  }

  _performAction(actionType) {
    if (!this.hass || !this.config) return;
    handleAction(this, this.hass, this.config, actionType);
  }

  render() {
    const tiles = this._getTiles();

    return html`
      <ha-card>
        <div class="header">
          <div
            class="power-button ${this.power ? "on" : ""}"
            @click=${this.togglePower}
          >
            <img src="/local/images/container-images/power_button.png" />
          </div>

          <div class="text-wrap">
            <div class="title">${this.config?.title || "Освещение"}</div>
            <div class="subtitle">${this.config?.subtitle || ""}</div>
          </div>
        </div>

        <div class="tile-container">
          ${tiles.length
            ? tiles.map((tile) => this._renderTile(tile))
            : html`<div class="empty">Добавь светильники в визуальном редакторе</div>`}
        </div>
      </ha-card>
    `;
  }

  static async getConfigElement() {
    await customElements.whenDefined("emelya-light-panel-editor");
    return document.createElement("emelya-light-panel-editor");
  }

  static getStubConfig() {
    return {
      title: "Освещение",
      subtitle: "Мастер-выключатель",
      tiles: [],
      tap_action: { action: "none" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" }
    };
  }
}

if (!customElements.get("emelya-light-panel-hui")) {
  customElements.define("emelya-light-panel-hui", EmelyaLightPanelHui);
}