import { LitElement, html, css } from "/local/lib/lit.js";
import { handleAction, hasAction } from "/local/lib/custom-card-helpers.js";

function clone(value) {
  return structuredClone(value);
}

function normalizeTileType(type) {
  if (!type || type === "hui-tile-card") return "tile";
  return type;
}

function detectTileMode(tile) {
  const features = Array.isArray(tile?.features) ? tile.features : [];
  const types = features.map((f) => f?.type).filter(Boolean);
  if (types.includes("light-brightness")) return "brightness";
  return "toggle";
}

function buildFeaturesByMode(mode) {
  if (mode === "brightness") return [{ type: "light-brightness" }];
  if (mode === "toggle") return [{ type: "toggle" }];
  return undefined;
}

function normalizeTileConfig(tile) {
  const cfg = clone(tile || {});
  cfg.type = normalizeTileType(cfg.type);
  return cfg;
}

function createDefaultTile(mode = "toggle", base = "/local", entity = "") {
  const tile = {
    type: "tile",
    entity,
    name: "",
    features_position: mode === "toggle" ? "inline" : undefined
  };
  const features = buildFeaturesByMode(mode);
  if (features) tile.features = features;
  return tile;
}

/* MAIN CARD */
class EmelyaLightPanelHui extends LitElement {
  static properties = {
    hass: {},
    config: {},
    power: { state: true },
  };

  static styles = css`
    :host {
      display: block;
      max-width: 450px; min-width: 320px;
      width: 100%;
      border-radius: 24px;
      border: none !important;
    }
    ha-card {
      border-radius: 24px !important;
      border: none !important;
      box-shadow: none !important;
      width: 100%;
      background: #1C1B1F;
      padding: 16px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 8px;
      cursor: pointer;
      user-select: none;
      position: relative;
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

    .header {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 0 0 8px;
    }
    .power-button {
      width: 64px;
      height: 64px;
      background: rgba(28, 27, 31, 1);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      position: relative;
      border: none;
      transition: background 0.2s ease;
    }
    .power-button.on { background: #343239; }
    .power-button::before {
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
    .power-button img { width: 14px; height: 20px; }

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
      gap: 8px;
      z-index: 0;
    }

    /* ── Toggle tile ── */
    .custom-tile-toggle {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #1C1B1F;
      border-radius: 24px;
      padding: 8px 0 0;
      box-sizing: border-box;
      cursor: pointer;
    }
    .custom-tile-toggle .tile-icon-btn {
      width: 64px; height: 64px;
      border-radius: 20px;
      background: rgba(28, 27, 31, 1);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; cursor: pointer; position: relative;
      transition: background 0.2s ease;
    }
    .custom-tile-toggle .tile-icon-btn.on { background: #343239; }
    .custom-tile-toggle .tile-icon-btn::before {
      content: "" !important; position: absolute !important; inset: 0 !important;
      padding: 1px !important; border-radius: inherit !important;
      background: linear-gradient(135deg, rgba(101,101,101,0) 0%, #656565 50%, rgba(101,101,101,0) 100%) !important;
      pointer-events: none !important;
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor !important; mask-composite: exclude !important;
    }
    .custom-tile-toggle .tile-icon-btn img { width: 14px; height: 20px; pointer-events: none; }
    .custom-tile-toggle .tile-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .custom-tile-toggle .tile-name {
      color: #fff; font-family: Roboto, sans-serif; font-size: 16px;
      font-weight: 600; line-height: 20px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .custom-tile-toggle .tile-state {
      color: rgba(255,255,255,0.50); font-family: Roboto, sans-serif;
      font-size: 15px; font-weight: 400; line-height: 20px;
    }

    /* ── Brightness tile ── */
    .custom-tile-brightness {
      display: flex; flex-direction: row; align-items: stretch;
      gap: 12px; background: #1C1B1F; border-radius: 24px;
      padding: 8px 0 0; box-sizing: border-box; cursor: pointer;
    }
    .custom-tile-brightness .tile-icon-btn {
      width: 64px; height: 64px;
      border-radius: 20px;
      background: rgba(28, 27, 31, 1);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; cursor: pointer; align-self: flex-end;
      position: relative; transition: background 0.2s ease;
    }
    .custom-tile-brightness .tile-icon-btn.on { background: #343239; }
    .custom-tile-brightness .tile-icon-btn::before {
      content: "" !important; position: absolute !important; inset: 0 !important;
      padding: 1px !important; border-radius: inherit !important;
      background: linear-gradient(135deg, rgba(101,101,101,0) 0%, #656565 50%, rgba(101,101,101,0) 100%) !important;
      pointer-events: none !important;
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor !important; mask-composite: exclude !important;
    }
    .custom-tile-brightness .tile-icon-btn img { width: 14px; height: 20px; pointer-events: none; }
    .custom-tile-brightness .tile-right {
      flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px;
    }
    .custom-tile-brightness .tile-header {
      display: flex; align-items: baseline; justify-content: space-between; gap: 8px;
    }
    .custom-tile-brightness .tile-name {
      color: #fff; font-family: Roboto, sans-serif; font-size: 16px;
      font-weight: 600; line-height: 20px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;
    }
    .custom-tile-brightness .tile-percent {
      color: rgba(255,255,255,0.50); font-family: Roboto, sans-serif;
      font-size: 15px; font-weight: 400; line-height: 20px; flex-shrink: 0;
    }

    /* ── Custom Slider ── */
    .slider-wrap {
      position: relative;
      width: 100%;
      height: 64px;
      border-radius: 20px;
      overflow: hidden;
      cursor: pointer;
      touch-action: none;
      user-select: none;
      box-sizing: border-box;
    }

    /* Gradient border via ::before — rendered above fill/thumb via z-index */
    .slider-wrap::before {
      content: "";
      position: absolute;
      inset: 0;
      padding: 1px;
      border-radius: 20px;
      background: linear-gradient(135deg, rgba(101,101,101,0) 0%, #656565 50%, rgba(101,101,101,0) 100%);
      pointer-events: none;
      z-index: 3;
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
    }

    /* Track background — ON state: vertical gradient */
    .slider-wrap.on {
      background: linear-gradient(90deg, #343239 50%, #1C1B1F 100%);


    }

    /* Track background — OFF state: flat dark */
    .slider-wrap.off {
      background: #1C1B1F;
    }

    /* Fill (active portion, left of thumb) */
    .slider-fill {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 0;
      border-radius:20px;
      transition: width 0.18s ease;
    }
    .slider-wrap.dragging .slider-fill,
    .slider-wrap.dragging .slider-thumb {
      transition: none;
    }

    /* ON state fill: flat surface-4 */
    .slider-wrap.on .slider-fill {
      background: #4D4A54;
    }

    /* OFF state fill: vertical gradient */
    .slider-wrap.off .slider-fill {
      background: linear-gradient(270deg, #343239 0%, #1C1B1F 100%);
    }

    /* Thumb — white vertical pill */
    .slider-thumb {
      position: absolute;
      top: 16px;
      width: 6px;
      height: 32px;
      background: #ffffff;
      border-radius: 3px;
      pointer-events: none;
      z-index: 2;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
      transition: left 0.18s ease;
    }

    .empty {
      color: rgba(255, 255, 255, 0.55);
      text-align: center;
      padding: 14px 10px;
      border: 1px dashed rgba(255, 255, 255, 0.12);
      border-radius: 16px;
    }
  `;

  constructor() {
    super();
    this.power = true;
    this._holdTimer = null;
    this._lastTap = 0;
    this._lastBrightness = {};
  }

  setConfig(config) {
    this.config = {
      title: "Освещение",
      subtitle: "Мастер-выключатель",
      tiles: [],
      tap_action: { action: "none" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" },
      base_path: "/local",
      ...clone(config || {})
    };
    this.base = this.config.base_path || "/local";
    this.config.tiles = (this.config.tiles || []).map(normalizeTileConfig);
  }

  get hass() {
    return this._hass;
  }

  set hass(hass) {
    this._saveBrightness(this._hass);
    this._saveBrightness(hass);
    this._hass = hass;
    this._syncPowerState();
    this.requestUpdate();
  }

  _saveBrightness(hass) {
    if (!hass) return;
    (this.config?.tiles || []).forEach(({ entity }) => {
      if (!entity) return;
      const stateObj = hass.states[entity];
      if (!stateObj) return;
      const brightness = stateObj.attributes?.brightness;
      if (typeof brightness === "number" && brightness > 0) {
        this._lastBrightness[entity] = brightness;
      }
    });
  }

  _syncPowerState() {
    if (!this._hass) return;
    const entityIds = (this.config?.tiles || []).map((t) => t?.entity).filter(Boolean);
    if (!entityIds.length) { this.power = true; return; }
    this.power = entityIds.some((id) => {
      const s = this._hass.states[id];
      return s && s.state !== "off";
    });
  }

  _lightEntities() {
    return (this.config?.tiles || []).map((t) => t?.entity).filter(Boolean);
  }

  togglePower(e) {
    e.stopPropagation();
    if (!this._hass) return;
    const entities = this._lightEntities();
    if (!entities.length) return;
    const shouldTurnOn = !this.power;
    this.power = shouldTurnOn;
    if (shouldTurnOn) {
      entities.forEach((entityId) => {
        const serviceData = { entity_id: entityId };
        const brightness = this._lastBrightness[entityId];
        if (brightness != null) serviceData.brightness = brightness;
        this._hass.callService("light", "turn_on", serviceData);
      });
    } else {
      entities.forEach((entityId) => {
        const brightness = this._hass.states[entityId]?.attributes?.brightness;
        if (typeof brightness === "number" && brightness > 0) {
          this._lastBrightness[entityId] = brightness;
        }
      });
      this._hass.callService("light", "turn_off", { entity_id: entities });
    }
  }

  _toggleEntity(e, entityId) {
    e.stopPropagation();
    if (!this._hass || !entityId) return;
    const stateObj = this._hass.states[entityId];
    const isOn = stateObj?.state === "on";
    if (isOn) {
      const brightness = stateObj?.attributes?.brightness;
      if (typeof brightness === "number" && brightness > 0) {
        this._lastBrightness[entityId] = brightness;
      }
      this._hass.callService("light", "turn_off", { entity_id: entityId });
    } else {
      const serviceData = { entity_id: entityId };
      const brightness = this._lastBrightness[entityId];
      if (brightness != null) serviceData.brightness = brightness;
      this._hass.callService("light", "turn_on", serviceData);
    }
  }

  /* ── Custom slider pointer handling ── */
  _sliderPointerDown(e, entityId) {
    e.stopPropagation();
    const wrap = e.currentTarget;
    wrap.setPointerCapture(e.pointerId);
    this._applySlider(e, entityId, wrap);

    const onMove = (ev) => {
      ev.stopPropagation();
      this._applySlider(ev, entityId, wrap);
    };
    const onUp = () => {
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerup", onUp);
    };
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerup", onUp);
  }

  _applySlider(e, entityId, wrap) {
    if (!this._hass || !entityId) return;
    const rect = wrap.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    const brightness = Math.round((percent / 100) * 255);
    if (brightness > 0) this._lastBrightness[entityId] = brightness;
    this._hass.callService("light", "turn_on", { entity_id: entityId, brightness });
  }

  _openMoreInfo(e, entityId) {
    e.stopPropagation();
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      bubbles: true, composed: true, detail: { entityId }
    }));
  }

  firstUpdated() {
    const frame = this.shadowRoot?.querySelector("ha-card");
    if (!frame) return;
    frame.addEventListener("pointerdown", this._onPointerDown.bind(this));
    frame.addEventListener("pointerup", this._onPointerUp.bind(this));
    frame.addEventListener("click", this._onClick.bind(this));
  }

  _onPointerDown(e) {
    if (e.target.closest(".power-button")) return;
    if (e.target.closest(".tile-container")) return;
    if (hasAction(this.config, "hold_action")) {
      this._holdTimer = setTimeout(() => this._performAction("hold"), 500);
    }
  }

  _onPointerUp() {
    if (this._holdTimer) { clearTimeout(this._holdTimer); this._holdTimer = null; }
  }

  _onClick(e) {
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
    setTimeout(() => { if (this._lastTap === now) this._performAction("tap"); }, 320);
  }

  _performAction(actionType) {
    if (!this.hass || !this.config) return;
    handleAction(this, this.hass, this.config, actionType);
  }

  _brightnessPercent(entityId) {
    const brightness =
      this._hass?.states?.[entityId]?.attributes?.brightness ??
      this._lastBrightness[entityId];
    if (brightness == null) return null;
    return Math.round((brightness / 255) * 100);
  }

  _brightnessSliderValue(entityId) {
    const brightness =
      this._hass?.states?.[entityId]?.attributes?.brightness ??
      this._lastBrightness[entityId] ??
      128;
    return Math.round((brightness / 255) * 100);
  }

  _onOffLabel(entityId) {
    const state = this._hass?.states?.[entityId]?.state;
    if (!state) return "";
    return state === "on" ? "Включено" : "Выключено";
  }

  _tileName(tile) {
    if (tile.name) return tile.name;
    if (!this._hass || !tile.entity) return tile.entity || "";
    return this._hass.states[tile.entity]?.attributes?.friendly_name || tile.entity;
  }

  _renderToggleTile(tile) {
    const entityId = tile.entity;
    const isOn = this._hass?.states?.[entityId]?.state === "on";
    return html`
      <div class="custom-tile-toggle" @click=${(e) => this._openMoreInfo(e, entityId)}>
        <div class="tile-icon-btn ${isOn ? "on" : ""}"
             @click=${(e) => { e.stopPropagation(); this._toggleEntity(e, entityId); }}>
          <img src="${this.base}/images/container-images/light_button.png" />
        </div>
        <div class="tile-text">
          <div class="tile-name">${this._tileName(tile) || "<Device>"}</div>
          <div class="tile-state">${this._onOffLabel(entityId)}</div>
        </div>
      </div>
    `;
  }

  _renderBrightnessTile(tile) {
    const entityId = tile.entity;
    const isOn = this._hass?.states?.[entityId]?.state === "on";
    const percent = this._brightnessPercent(entityId);
    const sliderValue = this._brightnessSliderValue(entityId);

    return html`
      <div class="custom-tile-brightness" @click=${(e) => this._openMoreInfo(e, entityId)}>
        <div class="tile-icon-btn ${isOn ? "on" : ""}"
            @click=${(e) => { e.stopPropagation(); this._toggleEntity(e, entityId); }}>
          <img src="${this.base}/images/container-images/light_button.png" />
        </div>
        <div class="tile-right">
          <div class="tile-header">
            <div class="tile-name">${this._tileName(tile) || "<Device>"}</div>
            ${percent != null ? html`<div class="tile-percent">${percent}%</div>` : ""}
          </div>
          <div
            class="slider-wrap ${isOn ? "on" : "off"}"
            @click=${(e) => e.stopPropagation()}
            @pointerdown=${(e) => this._sliderPointerDown(e, entityId)}
          >
            <div class="slider-fill" style="width: calc(16px + ${sliderValue / 100} * (100% - 38px) + 3px)">
              <div class="slider-thumb"
                style="right:16px">
              </div>
            </div>
            
          </div>
        </div>
      </div>
    `;
  }

  render() {
    const tiles = this.config?.tiles || [];
    return html`
      <ha-card>
        <div class="header">
          <div class="power-button ${this.power ? "on" : ""}" @click=${this.togglePower}>
            <img src="${this.base}/images/container-images/light_button.png" />
          </div>
          <div class="text-wrap">
            <div class="title">${this.config?.title || "Освещение"}</div>
            <div class="subtitle">${this.config?.subtitle || ""}</div>
          </div>
        </div>

        <div class="tile-container">
          ${tiles.length
            ? tiles.map((tile) =>
                detectTileMode(tile) === "brightness"
                  ? this._renderBrightnessTile(tile)
                  : this._renderToggleTile(tile)
              )
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
      base_path: "/local",
      tap_action: { action: "none" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" }
    };
  }
}

if (!customElements.get("emelya-light-panel-hui")) {
  customElements.define("emelya-light-panel-hui", EmelyaLightPanelHui);
}

/* EDITOR */
class EmelyaLightPanelEditor extends LitElement {
  static properties = {
    hass: {},
    _config: {},
    _tab: { state: true },
    _editingIndex: { state: true }
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
    .tile-list { display: flex; flex-direction: column; gap: 10px; }
    .tile-row {
      display: flex; justify-content: space-between; align-items: center;
      gap: 12px; padding: 12px; border-radius: 12px;
      border: 1px solid var(--divider-color);
      background: var(--secondary-background-color);
    }
    .tile-meta { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .tile-title { font-weight: 600; }
    .tile-subtitle { font-size: 13px; color: var(--secondary-text-color); word-break: break-word; }
    .tile-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .add-buttons { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
    .back-wrap { margin-bottom: 12px; }
    .edit-title { margin-bottom: 12px; font-weight: 600; }
    .empty {
      padding: 14px; border: 1px dashed var(--divider-color);
      border-radius: 12px; color: var(--secondary-text-color); text-align: center;
    }
  `;

  constructor() {
    super();
    this._tab = 0;
    this._editingIndex = null;
  }

  setConfig(config) {
    this._config = {
      title: "Освещение",
      subtitle: "Мастер-выключатель",
      tiles: [],
      tap_action: { action: "none" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" },
      base_path: "/local",
      ...clone(config || {})
    };
    this._config.tiles = (this._config.tiles || []).map(normalizeTileConfig);
    if (
      this._editingIndex !== null &&
      this._editingIndex > (this._config.tiles.length - 1)
    ) {
      this._editingIndex = null;
    }
  }

  render() {
    if (!this._config) return html``;
    return html`
      <div class="tabs">
        ${["Объект", "Светильники", "Взаимодействия"].map((label, i) => html`
          <div class="tab ${this._tab === i ? "active" : ""}"
               @click=${() => { this._tab = i; if (i !== 1) this._editingIndex = null; }}>
            ${label}
          </div>
        `)}
      </div>
      ${this._tab === 0 ? this._objectTab() : ""}
      ${this._tab === 1 ? this._lightsTab() : ""}
      ${this._tab === 2 ? this._actionsTab() : ""}
    `;
  }

  _objectTab() {
    return this._form([
      { name: "title",     label: "Заголовок",       selector: { text: {} } },
      { name: "subtitle",  label: "Подзаголовок",    selector: { text: {} } },
      { name: "base_path", label: "Путь к ресурсам", selector: { text: {} } }
    ], this._config, this._valueChanged);
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
    ], this._config, this._valueChanged);
  }

  _lightsTab() {
    const tiles = this._config.tiles || [];

    if (this._editingIndex !== null && tiles[this._editingIndex]) {
      const tile = this._toEditorTile(tiles[this._editingIndex]);
      return html`
        <div class="back-wrap">
          <ha-button @click=${this._back}>⬅ Назад</ha-button>
        </div>
        <div class="edit-title">Светильник ${this._editingIndex + 1}</div>
        ${this._form(this._tileSchema(), tile, this._tileValueChanged)}
      `;
    }

    return html`
      <div class="tile-list">
        ${tiles.length
          ? tiles.map((tile, i) => html`
              <div class="tile-row">
                <div class="tile-meta">
                  <div class="tile-title">
                    ${tile.name || tile.entity || `Светильник ${i + 1}`}
                  </div>
                  <div class="tile-subtitle">
                    ${this._tileTypeLabel(detectTileMode(tile))}
                    ${tile.entity ? ` • ${tile.entity}` : " • entity не выбрана"}
                  </div>
                </div>
                <div class="tile-actions">
                  <ha-button @click=${() => this._edit(i)}>Изменить</ha-button>
                  <ha-button @click=${() => this._remove(i)}>Удалить</ha-button>
                </div>
              </div>
            `)
          : html`<div class="empty">Пока нет ни одного светильника</div>`}
      </div>
      <div class="add-buttons">
        <ha-button @click=${() => this._addTile("toggle")}>Добавить: вкл/выкл</ha-button>
        <ha-button @click=${() => this._addTile("brightness")}>Добавить: яркость + вкл/выкл</ha-button>
      </div>
    `;
  }

  _tileSchema() {
    return [
      {
        name: "entity", label: "Светильник", required: true,
        selector: { entity: { domain: "light" } }
      },
      { name: "name", label: "Название", selector: { text: {} } },
      {
        name: "tile_type", label: "Тип объекта",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "toggle",     label: "Только вкл/выкл" },
              { value: "brightness", label: "Яркость + вкл/выкл" }
            ]
          }
        }
      }
    ];
  }

  _form(schema, data, handler) {
    return html`
      <ha-form .hass=${this.hass} .data=${data} .schema=${schema}
               @value-changed=${handler}></ha-form>
    `;
  }

  _valueChanged = (e) => {
    this._config = { ...this._config, ...e.detail.value };
    this._fire();
  };

  _tileValueChanged = (e) => {
    const rawEditorTile = e.detail.value;
    const tiles = [...(this._config.tiles || [])];
    const current = clone(tiles[this._editingIndex] || {});
    const updated = this._fromEditorTile(rawEditorTile, current);
    tiles[this._editingIndex] = updated;
    this._config = { ...this._config, tiles };
    this._fire();
  };

  _toEditorTile(tile) {
    return {
      entity: tile.entity || "",
      name: tile.name || "",
      tile_type: detectTileMode(tile)
    };
  }

  _fromEditorTile(editorTile, currentTile = {}) {
    const result = clone(currentTile);
    result.type = "tile";
    result.entity = editorTile.entity || "";
    if (editorTile.name) result.name = editorTile.name;
    else delete result.name;
    const features = buildFeaturesByMode(editorTile.tile_type);
    if (features) result.features = features;
    else delete result.features;
    result.features_position = editorTile.tile_type === "toggle" ? "inline" : undefined;
    return normalizeTileConfig(result);
  }

  _tileTypeLabel(type) {
    return type === "brightness" ? "Яркость + вкл/выкл" : "Только вкл/выкл";
  }

  _addTile(type) {
    const tiles = [...(this._config.tiles || [])];
    tiles.push(createDefaultTile(type, this._config.base_path));
    this._config = { ...this._config, tiles };
    this._editingIndex = tiles.length - 1;
    this._fire();
  }

  _edit(i) { this._editingIndex = i; }
  _back = () => { this._editingIndex = null; };

  _remove(i) {
    const tiles = [...(this._config.tiles || [])];
    tiles.splice(i, 1);
    this._config = { ...this._config, tiles };
    if (this._editingIndex === i) this._editingIndex = null;
    this._fire();
  }

  _fire() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true, composed: true
    }));
  }
}

if (!customElements.get("emelya-light-panel-editor")) {
  customElements.define("emelya-light-panel-editor", EmelyaLightPanelEditor);
}

/* REGISTER */
window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom:emelya-light-panel-hui",
  name: "Emelya Light Panel",
  description: "Light panel with visual editor",
  preview: true
});