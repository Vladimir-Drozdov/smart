import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";
import {
  handleAction,
  hasAction
} from "https://unpkg.com/custom-card-helpers@2.0.0/dist/index.m.js?module";

const getDefaultTileCardMod = (base = "/local", entity = "") => ({
  style: {
    ".": `
      ha-card {
        --tile-color: #343239 !important;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        border-radius: 20px !important;
        z-index: 2 !important;
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

      /* Hide the entire tile header (icon + name + state) — we render our own */
      ha-card ha-tile-container ha-tile-icon {
        display: none !important;
      }
      ha-card ha-tile-container ha-tile-info {
        display: none !important;
      }
      ha-card ha-tile-container hui-card-features {
        padding: 0 !important;
      }
    `,
    "ha-tile-container": {
      "$": `
        .content { 
          padding: 0 !important; 
        }
      `,

      "hui-card-features $": {
        "hui-card-feature $": {
          "hui-light-brightness-card-feature $":{
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

const getDefaultTileCardModToggle = (base = "/local", entity = "") => ({
  style: {
    ".": `
      ha-card {
        --tile-color: #343239 !important;
        background: rgba(28, 27, 31, 1) !important;
        border: none !important;
        box-shadow: none !important;
        padding: 8px !important;
        border-radius: 24px !important;
      }
      ha-card:hover { background: rgba(28, 27, 31, 1) !important; }
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
        max-width: 100% !important;
        box-sizing: content-box !important;
      }

      ha-card ha-tile-container ha-tile-icon{
        width: 64px !important;
        height: 64px !important;
        border-radius: 20px !important;
        margin: 0px !important;
        padding: 0px !important;
        display:flex !important;
        justify-content:center !important;
        align-items:center !important;
        position: relative !important;
        cursor: pointer !important;
        pointer-events: auto !important;
        background: #343239 !important;
      }
      ha-card ha-tile-container ha-tile-icon ha-state-icon{
        display:none !important;
        opacity:0 !important;
        visibility: hidden !important;
      }
      ha-card ha-tile-container ha-tile-icon::after{
        content: "" !important;
        position: absolute !important;
        top:50% !important;
        left:50% !important;
        background: url("${base}/images/container-images/light_button.png") center / 14px 20px no-repeat !important;
        transform: translate(-50%, -50%) !important;
        width: 14px !important;
        height:20px !important;
        pointer-events: none !important;
      }
      ha-card ha-tile-container ha-tile-icon::before {
        content: "" !important;
        position: absolute !important;
        inset: 0 !important;
        padding: 1px !important;
        border-radius: inherit !important;
        background: 
          linear-gradient(135deg, rgba(101, 101, 101, 0) 0%, #656565 50%, rgba(101, 101, 101, 0) 100%),
          url("${base}/images/container-images/light_button.png") center / 32px 32px no-repeat !important;
        pointer-events: none !important;
        -webkit-mask:
          linear-gradient(#fff 0 0) content-box,
          linear-gradient(#fff 0 0) !important;
        -webkit-mask-composite: xor !important;
        mask-composite: exclude !important;
      }

      ha-card ha-tile-container ha-tile-info span:nth-child(2) {
        text-align: left !important;
        font-family: Roboto;
        font-size: 16px;
        font-weight: 600;
        line-height: 20px;
      }
      ha-card ha-tile-container ha-tile-info span:nth-child(3) {
        text-align: left !important;
        color: rgba(255, 255, 255, 0.50) !important;
        font-family: Roboto;
        font-size: 15px;
        font-weight: 400;
        line-height: 20px;
      }

      ha-card ha-tile-container hui-card-features {
        display: none !important;
        opacity:0 !important;
        visibility:hidden !important;
      }
    `,

    "ha-tile-container ha-tile-icon":{
      "$":`
        .container.background,
        .container {
          opacity:0 !important;
          width:64px !important;
          height: 64px !important;
          border-radius: 20px !important;
        }
      `
    },

    "ha-tile-container": {
      "$": `
        .content { 
          padding: 0 !important; 
        }
      `,
      "ha-tile-info": {
        "$": `
          .info {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        `
      }
    }
  }
});


function clone(value) {
  return structuredClone(value);
}

function getDefaultCardMod(mode, base, entity = "") {
  return mode === "toggle"
    ? getDefaultTileCardModToggle(base, entity)
    : getDefaultTileCardMod(base, entity);
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

function normalizeTileConfig(tile, base) {
  const cfg = clone(tile || {});
  cfg.type = normalizeTileType(cfg.type);
  const mode = detectTileMode(cfg);
  cfg.card_mod = getDefaultCardMod(mode, base, cfg.entity || "");
  return cfg;
}

function createDefaultTile(mode = "toggle", base = "/local", entity = "") {
  const tile = {
    type: "tile",
    entity,
    name: "",
    card_mod: getDefaultCardMod(mode, base, entity),
    features_position: mode === "toggle" ? "inline" : undefined
  };

  const features = buildFeaturesByMode(mode);
  if (features) tile.features = features;

  return tile;
}

/*  MAIN CARD */
class EmelyaLightPanelHui extends LitElement {
  static properties = {
    hass: {},
    config: {},
    power: { state: true },
    _tilesVisible: { state: true }
  };

  static styles = css`
    :host {
      display: block;
      max-width:450px; min-width:320px;
      width: 100%;
      border-radius:24px;
      border:none !important;
    }
    ha-card{
      border-radius:24px !important;
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

    /* ── Header ─────────────────────────────────────── */
    .header {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 0 0 8px;
    }

    .power-button {
      width: 64px;
      height: 64px;
      /* OFF state color */
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
    .power-button.on {
      background: #343239;
    }
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
    .power-button img{
      width:14px;
      height:20px;
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

    /* ── Tile list ──────────────────────────────────── */
    .tile-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 0;
    }
    .skeleton-overlay {
      position: absolute;
      inset: 0;
      border-radius: 24px;
      background: #1C1B1F;
      z-index: 5;
      opacity: 1;
      transition: opacity 0.25s ease;
      pointer-events: none;
    }
    .skeleton-overlay.hidden {
      opacity: 0;
    }

    /* ── Skeleton placeholders (shown while tiles are loading) ── */
    .tile-skeleton {
      border-radius: 24px;
      background: #1C1B1F;
      position: relative;
      overflow: hidden;
    }
    .tile-skeleton::before {
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
    .tile-skeleton-toggle  { height: 88px; }
    .tile-skeleton-brightness { height: 152px; }

    /* ── Toggle tile wrapper ─────────────────────────── */
    .custom-tile-toggle {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #1C1B1F;
      border-radius: 24px;
      padding: 8px 0px 0px;
      box-sizing: border-box;
      cursor: pointer;
    }

    .custom-tile-toggle .tile-icon-btn {
      width: 64px;
      height: 64px;
      border-radius: 20px;
      /* OFF state */
      background: rgba(28, 27, 31, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      cursor: pointer;
      position: relative;
      transition: background 0.2s ease;
    }
    .custom-tile-toggle .tile-icon-btn.on {
      background: #343239;
    }
    .custom-tile-toggle .tile-icon-btn::before {
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
    .custom-tile-toggle .tile-icon-btn img {
      width: 14px;
      height: 20px;
      pointer-events: none;
    }

    .custom-tile-toggle .tile-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .custom-tile-toggle .tile-name {
      color: #fff;
      font-family: Roboto, sans-serif;
      font-size: 16px;
      font-weight: 600;
      line-height: 20px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .custom-tile-toggle .tile-state {
      color: rgba(255,255,255,0.50);
      font-family: Roboto, sans-serif;
      font-size: 15px;
      font-weight: 400;
      line-height: 20px;
    }

    /* ── Brightness tile wrapper ─────────────────────── */
    .custom-tile-brightness {
      display: flex;
      flex-direction: row;
      align-items: stretch;
      gap: 12px;
      background: #1C1B1F;
      border-radius: 24px;
      padding: 8px 0px 0px;
      box-sizing: border-box;
      cursor: pointer;
    }

    .custom-tile-brightness .tile-icon-btn {
      width: 64px;
      height: 64px;
      border-radius: 20px;
      /* OFF state */
      background: rgba(28, 27, 31, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      cursor: pointer;
      align-self: flex-end;
      position: relative;
      transition: background 0.2s ease;
    }
    .custom-tile-brightness .tile-icon-btn.on {
      background: #343239;
    }
    .custom-tile-brightness .tile-icon-btn::before {
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
    .custom-tile-brightness .tile-icon-btn img {
      width: 14px;
      height: 20px;
      pointer-events: none;
    }

    .custom-tile-brightness .tile-right {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .custom-tile-brightness .tile-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
      padding: 0px 0px 8px 0px;
    }
    .custom-tile-brightness .tile-name {
      color: #fff;
      font-family: Roboto, sans-serif;
      font-size: 16px;
      font-weight: 600;
      line-height: 20px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }
    .custom-tile-brightness .tile-percent {
      color: rgba(255,255,255,0.50);
      font-family: Roboto, sans-serif;
      font-size: 15px;
      font-weight: 400;
      line-height: 20px;
      flex-shrink: 0;
    }

    .custom-tile-brightness .tile-card-wrap {
      width: 100%;
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
    this._cards = [];
    this._buildToken = 0;
    this._holdTimer = null;
    this._lastTap = 0;
    this._lastBrightness = {};
    this._lastIsOn = {};
    this._tilesVisible = false;
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

    this.config.tiles = (this.config.tiles || []).map((tile) => normalizeTileConfig(tile, this.base));
    this._rebuildCards();
  }

  get hass() {
    return this._hass;
  }

  set hass(hass) {
    this._saveBrightness(this._hass);
    this._saveBrightness(hass);

    this._hass = hass;

    const hassForCards = this._buildHassForCards(hass);
    this._cards?.forEach((card) => {
      card.hass = hassForCards;
    });
    this._cards?.forEach((card, i) => {
      const entityId = this.config?.tiles?.[i]?.entity;
      if (!entityId) return;
      const isOn = hass?.states?.[entityId]?.state === "on";
      if (isOn !== this._lastIsOn[entityId]) {
        this._lastIsOn[entityId] = isOn;
        this._updateSliderColors(card, isOn);
      }
    });
    this._syncPowerState();
    this.requestUpdate();
  }

  _buildHassForCards(hass) {
    if (!hass) return hass;

    const entities = (this.config?.tiles || [])
      .map((t) => t?.entity)
      .filter(Boolean);

    if (!entities.length) return hass;

    const needsPatch = entities.some((entityId) => {
      const stateObj = hass.states[entityId];
      if (!stateObj || this._lastBrightness[entityId] == null) return false;
      return stateObj.state === "off" ||
        (stateObj.state === "on" && !(stateObj.attributes?.brightness > 0));
    });

    if (!needsPatch) return hass;

    const patchedStates = { ...hass.states };

    entities.forEach((entityId) => {
      const stateObj = hass.states[entityId];
      if (!stateObj) return;

      const savedBrightness = this._lastBrightness[entityId];
      if (savedBrightness == null) return;

      const currentBrightness = stateObj.attributes?.brightness;

      const needsInject =
        stateObj.state === "off" ||
        (stateObj.state === "on" && !(currentBrightness > 0));

      if (!needsInject) return;

      patchedStates[entityId] = {
        ...stateObj,
        attributes: {
          ...stateObj.attributes,
          brightness: savedBrightness
        }
      };
    });

    return { ...hass, states: patchedStates };
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

  async _rebuildCards() {
    const token = ++this._buildToken;
    const tiles = Array.isArray(this.config?.tiles) ? this.config.tiles : [];
    const validTiles = tiles.filter((tile) => tile?.entity);

    this._tilesVisible = false;

    if (!validTiles.length) {
      this._cards = [];
      this._syncPowerState();
      this._tilesVisible = true;
      this.requestUpdate();
      return;
    }

    try {
      const helpers = await window.loadCardHelpers();
      if (token !== this._buildToken) return;

      const built = await Promise.all(
        validTiles.map(async (tile) => {
          try {
            const cfg = normalizeTileConfig(tile, this.base);
            const card = await helpers.createCardElement(cfg);
            if (this._hass) card.hass = this._buildHassForCards(this._hass);
            return card;
          } catch (err) {
            console.error("emelya-light-panel-hui: tile build error", tile, err);
            return null;
          }
        })
      );

      if (token !== this._buildToken) return;

      this._cards = built.filter(Boolean);
      this._syncPowerState();

      this.requestUpdate();
      await this.updateComplete;

      // Даём card-mod 6 кадров чтобы полностью применить стили до показа
      await new Promise(resolve => setTimeout(resolve, 400));

      if (token !== this._buildToken) return;

      this._cards.forEach((card, i) => {
        const entityId = validTiles[i]?.entity;
        if (!entityId) return;
        this._forceShowHandle(card);
        const isOn = this._hass?.states?.[entityId]?.state === "on";
        this._lastIsOn[entityId] = isOn;
        this._updateSliderColors(card, isOn);
        this._watchSliderColors(card, entityId);
      });

      this._tilesVisible = true;

    } catch (err) {
      console.error("emelya-light-panel-hui: rebuild error", err);
      this._cards = [];
      this._tilesVisible = true;
      this.requestUpdate();
    }
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
      return stateObj && stateObj.state !== "off";
    });
  }

  _lightEntities() {
    return (this.config?.tiles || [])
      .map((tile) => tile?.entity)
      .filter(Boolean);
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
        const brightness = this._lastBrightness[entityId];
        const serviceData = { entity_id: entityId };
        if (brightness != null) serviceData.brightness = brightness;
        this._hass.callService("light", "turn_on", serviceData);
      });
    } else {
      entities.forEach((entityId) => {
        const stateObj = this._hass.states[entityId];
        const brightness = stateObj?.attributes?.brightness;
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
      const brightness = this._lastBrightness[entityId];
      const serviceData = { entity_id: entityId };
      if (brightness != null) serviceData.brightness = brightness;
      this._hass.callService("light", "turn_on", serviceData);
    }
  }

  _openMoreInfo(e, entityId) {
    e.stopPropagation();
    if (!entityId) return;
    const event = new CustomEvent("hass-more-info", {
      bubbles: true,
      composed: true,
      detail: { entityId }
    });
    this.dispatchEvent(event);
  }

  firstUpdated() {
    const frame = this.shadowRoot?.querySelector("ha-card");
    if (!frame) return;

    frame.addEventListener("pointerdown", this._onPointerDown.bind(this));
    frame.addEventListener("pointerup", this._onPointerUp.bind(this));
    frame.addEventListener("click", this._onClick.bind(this));
  }

  _forceShowHandle(card) {
    const applyClass = (root) => {
      if (!root) return;
      root.querySelectorAll(".slider-track-bar").forEach((el) => {
        if (!el.classList.contains("show-handle")) {
          el.classList.add("show-handle");
        }
      });
    };

    const observeCard = (shadowRoot) => {
      applyClass(shadowRoot);
      const mo = new MutationObserver((mutations) => {
        let needsApply = false;
        for (const m of mutations) {
          if (
            m.type === "attributes" &&
            m.attributeName === "class" &&
            m.target.classList.contains("slider-track-bar") &&
            !m.target.classList.contains("show-handle")
          ) {
            needsApply = true;
            break;
          }
        }
        if (needsApply) applyClass(shadowRoot);
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
        const waitForShadow = () => {
          if (slider.shadowRoot) {
            observeCard(slider.shadowRoot);
          } else {
            requestAnimationFrame(waitForShadow);
          }
        };
        waitForShadow();
      });

      root.querySelectorAll("*").forEach((el) => {
        if (el.shadowRoot) findSliders(el.shadowRoot, depth + 1);
      });
    };

    const waitForCard = () => {
      if (card.shadowRoot) {
        findSliders(card.shadowRoot);
      } else {
        requestAnimationFrame(waitForCard);
      }
    };
    requestAnimationFrame(waitForCard);
  }

  _applyTrackBarColor(root, color, depth = 0) {
    if (!root || depth > 10) return;
    const sr = root.shadowRoot || root;
    sr.querySelectorAll(".slider-track-bar").forEach((el) => {
      el.style.setProperty("background", color, "important");
    });
    sr.querySelectorAll("*").forEach((el) => {
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

  _updateSliderColors(card, isOn) {
    const trackColor = isOn ? "#4D4A54" : "linear-gradient(270deg, #343239 0%, #1C1B1F 100%)";
    const sliderBg   = isOn ? "linear-gradient(90deg, #343239 50%, #1C1B1F 100%)" : "#1C1B1F";
    this._applyTrackBarColor(card, trackColor);
    this._applySliderBgColor(card, sliderBg);
  }

  _watchSliderColors(card, entityId) {
    const getTrackColor = () =>
      this._hass?.states?.[entityId]?.state === "on"
        ? "#4D4A54"
        : "linear-gradient(270deg, #343239 0%, #1C1B1F 100%)";

    const getSliderBg = () =>
      this._hass?.states?.[entityId]?.state === "on"
        ? "linear-gradient(90deg, #343239 50%, #1C1B1F 100%)"
        : "#1C1B1F";

    const observeShadow = (shadowRoot) => {
      shadowRoot.querySelectorAll(".slider-track-bar").forEach((el) => {
        el.style.setProperty("background", getTrackColor(), "important");
      });
      shadowRoot.querySelectorAll(".slider").forEach((el) => {
        el.style.setProperty("background", getSliderBg(), "important");
      });

      const mo = new MutationObserver(() => {
        shadowRoot.querySelectorAll(".slider-track-bar").forEach((el) => {
          el.style.setProperty("background", getTrackColor(), "important");
        });
        shadowRoot.querySelectorAll(".slider").forEach((el) => {
          el.style.setProperty("background", getSliderBg(), "important");
        });
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

  _onPointerDown(e) {
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

  _brightnessLabel(entityId) {
    if (!this._hass || !entityId) return "";
    const stateObj = this._hass.states[entityId];
    if (!stateObj) return "";
    const brightness = stateObj.attributes?.brightness ?? this._lastBrightness[entityId];
    if (brightness == null) return "";
    return `${Math.round((brightness / 255) * 100)}%`;
  }

  _onOffLabel(entityId) {
    if (!this._hass || !entityId) return "";
    const stateObj = this._hass.states[entityId];
    if (!stateObj) return "";
    return stateObj.state === "on" ? "Включено" : "Выключено";
  }

  _tileName(tile) {
    if (tile.name) return tile.name;
    if (!this._hass || !tile.entity) return tile.entity || "";
    return this._hass.states[tile.entity]?.attributes?.friendly_name || tile.entity;
  }

  _renderToggleTile(tile, i) {
    const entityId = tile.entity;
    const name = this._tileName(tile);
    const state = this._onOffLabel(entityId);
    const isOn = this._hass?.states?.[entityId]?.state === "on";

    return html`
      <div class="custom-tile-toggle" @click=${(e) => this._openMoreInfo(e, entityId)}>
        <div class="tile-icon-btn ${isOn ? "on" : ""}" @click=${(e) => { e.stopPropagation(); this._toggleEntity(e, entityId); }}>
          <img src="${this.base}/images/container-images/light_button.png" />
        </div>
        <div class="tile-text">
          <div class="tile-name">${name || "<Device>"}</div>
          <div class="tile-state">${state || "off"}</div>
        </div>
      </div>
    `;
  }

  _renderBrightnessTile(tile, i) {
    const entityId = tile.entity;
    const name = this._tileName(tile);
    const percent = this._brightnessLabel(entityId);
    const card = this._cards[i];
    const isOn = this._hass?.states?.[entityId]?.state === "on";

    return html`
      <div class="custom-tile-brightness" @click=${(e) => this._openMoreInfo(e, entityId)}>
        <div class="tile-icon-btn ${isOn ? "on" : ""}" @click=${(e) => { e.stopPropagation(); this._toggleEntity(e, entityId); }}>
          <img src="${this.base}/images/container-images/light_button.png" />
        </div>
        <div class="tile-right">
          <div class="tile-header">
            <div class="tile-name">${name || "<Device>"}</div>
            ${percent ? html`<div class="tile-percent">${percent}</div>` : ""}
          </div>
          ${card ? html`<div class="tile-card-wrap" @click=${(e) => e.stopPropagation()}>${card}</div>` : ""}
        </div>
      </div>
    `;
  }

  render() {
    const tiles = this.config?.tiles || [];

    return html`
      <ha-card>
        <div class="header">
          <div
            class="power-button ${this.power ? "on" : ""}"
            @click=${this.togglePower}
          >
            <img src="${this.base}/images/container-images/light_button.png" />
          </div>

          <div class="text-wrap">
            <div class="title">${this.config?.title || "Освещение"}</div>
            <div class="subtitle">${this.config?.subtitle || ""}</div>
          </div>
        </div>

        <div class="tile-container">
          ${tiles.length
            ? tiles.map((tile, i) => {
                const mode = detectTileMode(tile);
                if (mode === "brightness") {
                  return this._renderBrightnessTile(tile, i);
                } else {
                  return this._renderToggleTile(tile, i);
                }
              })
            : html`<div class="empty">Добавь светильники в визуальном редакторе</div>`}
        </div>

        ${tiles.length ? html`
          <div class="skeleton-overlay ${this._tilesVisible ? "hidden" : ""}">
            ${tiles.map((tile) => {
              const mode = detectTileMode(tile);
              return html`<div class="tile-skeleton tile-skeleton-${mode === "brightness" ? "brightness" : "toggle"}"></div>`;
            })}
          </div>
        ` : ""}

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
    :host {
      display: block;
      box-sizing: border-box;
    }

    .tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .tab {
      padding: 8px 12px;
      border-radius: 10px;
      border: 1px solid var(--divider-color);
      background: var(--secondary-background-color);
      cursor: pointer;
      user-select: none;
    }

    .tab.active {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }

    .tile-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .tile-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 12px;
      border: 1px solid var(--divider-color);
      background: var(--secondary-background-color);
    }

    .tile-meta {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .tile-title {
      font-weight: 600;
    }

    .tile-subtitle {
      font-size: 13px;
      color: var(--secondary-text-color);
      word-break: break-word;
    }

    .tile-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .add-buttons {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 16px;
    }

    .back-wrap {
      margin-bottom: 12px;
    }

    .edit-title {
      margin-bottom: 12px;
      font-weight: 600;
    }

    .empty {
      padding: 14px;
      border: 1px dashed var(--divider-color);
      border-radius: 12px;
      color: var(--secondary-text-color);
      text-align: center;
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
    this._config.tiles = (this._config.tiles || []).map(
      (tile) => normalizeTileConfig(tile, this._config.base_path)
    );

    if (
      this._editingIndex !== null &&
      (!this._config.tiles || this._editingIndex > this._config.tiles.length - 1)
    ) {
      this._editingIndex = null;
    }
  }

  render() {
    if (!this._config) return html``;

    return html`
      <div class="tabs">
        ${["Объект", "Светильники", "Взаимодействия"].map((label, i) => html`
          <div
            class="tab ${this._tab === i ? "active" : ""}"
            @click=${() => {
              this._tab = i;
              if (i !== 1) this._editingIndex = null;
            }}
          >
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
    return this._form(
      [
        { name: "title", label: "Заголовок", selector: { text: {} } },
        { name: "subtitle", label: "Подзаголовок", selector: { text: {} } },
        { name: "base_path", label: "Путь к ресурсам", selector: { text: {} } }
      ],
      this._config,
      this._valueChanged
    );
  }

  _actionsTab() {
    return this._form(
      [
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
      ],
      this._config,
      this._valueChanged
    );
  }

  _lightsTab() {
    const tiles = this._config.tiles || [];

    if (this._editingIndex !== null && tiles[this._editingIndex]) {
      const tile = this._toEditorTile(tiles[this._editingIndex]);

      return html`
        <div class="back-wrap">
          <ha-button @click=${this._back}>⬅ Назад</ha-button>
        </div>

        <div class="edit-title">
          Светильник ${this._editingIndex + 1}
        </div>

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
        <ha-button @click=${() => this._addTile("toggle")}>
          Добавить: вкл/выкл
        </ha-button>
        <ha-button @click=${() => this._addTile("brightness")}>
          Добавить: яркость + вкл/выкл
        </ha-button>
      </div>
    `;
  }

  _tileSchema() {
    return [
      {
        name: "entity",
        label: "Светильник",
        required: true,
        selector: { entity: { domain: "light" } }
      },
      {
        name: "name",
        label: "Название",
        selector: { text: {} }
      },
      {
        name: "tile_type",
        label: "Тип объекта",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "toggle", label: "Только вкл/выкл" },
              { value: "brightness", label: "Яркость + вкл/выкл" }
            ]
          }
        }
      }
    ];
  }

  _form(schema, data, handler) {
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${schema}
        @value-changed=${handler}
      ></ha-form>
    `;
  }

  _valueChanged = (e) => {
    this._config = {
      ...this._config,
      ...e.detail.value
    };
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

    result.card_mod = getDefaultCardMod(editorTile.tile_type, this._config?.base_path, editorTile.entity || "");
    result.features_position = editorTile.tile_type === "toggle" ? "inline" : undefined;

    return normalizeTileConfig(result, this._config?.base_path);
  }

  _tileTypeLabel(type) {
    if (type === "brightness") return "Яркость + вкл/выкл";
    return "Только вкл/выкл";
  }

  _addTile(type) {
    const tiles = [...(this._config.tiles || [])];
    tiles.push(createDefaultTile(type, this._config.base_path));
    this._config = { ...this._config, tiles };
    this._editingIndex = tiles.length - 1;
    this._fire();
  }

  _edit(i) {
    this._editingIndex = i;
  }

  _back = () => {
    this._editingIndex = null;
  };

  _remove(i) {
    const tiles = [...(this._config.tiles || [])];
    tiles.splice(i, 1);
    this._config = { ...this._config, tiles };
    if (this._editingIndex === i) this._editingIndex = null;
    this._fire();
  }

  _fire() {
    const tilesForSave = (this._config.tiles || []).map((tile) => {
      const { card_mod, ...rest } = tile;
      return rest;
    });

    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: { ...this._config, tiles: tilesForSave } },
      bubbles: true,
      composed: true
    }));
  }
}

if (!customElements.get("emelya-light-panel-editor")) {
  customElements.define("emelya-light-panel-editor", EmelyaLightPanelEditor);
}

/*  REGISTER */
window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom:emelya-light-panel-hui",
  name: "Emelya Light Panel",
  description: "Light panel with visual editor",
  preview: true
});