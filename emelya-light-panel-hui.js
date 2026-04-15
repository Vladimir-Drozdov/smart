import { LitElement, html, css } from "https://unpkg.com/lit@2.8.0/index.js?module";
import {
  handleAction,
  hasAction
} from "https://unpkg.com/custom-card-helpers@2.0.0/dist/index.m.js?module";

const DEFAULT_TILE_CARD_MOD = {
  style: {
    ".": `
      ha-card {
        --tile-color: #E65332 !important;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
      }
      ha-card:hover { background: transparent !important; }

      ha-card ha-tile-container ha-tile-info {
        width: 286px !important;
        max-width: 286px !important;
        box-sizing: content-box !important;
      }
      ha-card ha-tile-container ha-tile-icon {
        display: none !important;
      }
      ha-card ha-tile-container ha-tile-info span:nth-child(2) {
        text-align: left !important;
        font-family: Roboto;
        font-size: 16px;
        font-weight: 600;
        line-height: 20px;
      }
      ha-card ha-tile-container ha-tile-info span:nth-child(3) {
        text-align: right !important;
        color: rgba(255, 255, 255, 0.50);
        font-family: Roboto;
        font-size: 15px;
        font-weight: 400;
        line-height: 20px;
      }
      ha-card ha-tile-container hui-card-features {
        padding: 0 !important;
      }
    `,

    "ha-tile-container": {
      "$": `
        .content { 
          padding: 0 0 10px 0 !important; 
        }
      `,
      "ha-tile-info": {
        "$": `
          .info {
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
          }
        `
      },

      /* Толстый слайдер 64px + белая полоска с отступом 16px от конца */
      "hui-card-features $": {
        "hui-card-feature $": {
          "hui-light-brightness-card-feature $":{
            "ha-control-slider $":`
              .slider .slider-track-bar::after{
                right: 16px !important;
                --handle-margin: 16px !important;
              }
              .slider .slider-track-cursor::after{
                right: 16px !important;
                --handle-margin: 16px !important;
              }
            `,
            "." : `
              ha-control-slider {
                --control-slider-thickness: 64px !important;
                height: 64px !important;
                min-height: 64px !important;
              }
              ha-control-slider .container {
                height: 64px !important;
              }
              ha-control-slider .slider {
                height: 64px !important;
                border-radius: 32px !important;
              }
              ha-control-slider .slider .slider-track-bar {
                height: 64px !important;
                border-radius: 32px !important;
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
              border-radius: 32px !important;
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
};

const DEFAULT_TILE_CARD_MOD_TOGGLE = {
  style: {
    ".": `
      ha-card {
        --tile-color: #E65332 !important;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
      }
      ha-card:hover { background: transparent !important; }

      ha-card ha-tile-container ha-tile-icon {
        display: none !important;
      }
      ha-card ha-tile-container ha-tile-info {
        width: 286px !important;
        max-width: 286px !important;
        box-sizing: content-box !important;
      }
      ha-card ha-tile-container ha-tile-info span:nth-child(2) {
        text-align: left !important;
        font-family: Roboto;
        font-size: 16px;
        font-weight: 600;
        line-height: 20px;
      }
      ha-card ha-tile-container ha-tile-info span:nth-child(3) {
        display: none !important; /* убираем процент */
      }

      /* === Главное: чистый нативный toggle === */
      ha-tile-container hui-card-feature hui-toggle-card-feature {
        display: flex !important;
        align-items: center !important;
        justify-content: flex-end !important;
        width: 100% !important;
      }
      ha-tile-container hui-card-feature hui-toggle-card-feature ha-icon {
        display: none !important; /* убираем лампочку */
      }
      ha-tile-container hui-card-feature hui-toggle-card-feature ha-switch {
        --mdc-switch-track-height: 28px !important;
        --mdc-switch-handle-size: 24px !important;
        --mdc-switch-track-width: 52px !important;
        margin-left: auto !important;
      }

      ha-card ha-tile-container hui-card-features {
        padding: 0 !important;
      }
    `,
    "ha-tile-container": {
      "$": `
        .content { padding: 0 0 10px 0 !important; }
      `,
      "ha-tile-info": {
        "$": `
          .info {
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
          }
        `
      }
    }
  }
};

function clone(value) {
  return structuredClone(value);
}

function getDefaultCardMod(mode) {
  return mode === "toggle" 
    ? clone(DEFAULT_TILE_CARD_MOD_TOGGLE) 
    : clone(DEFAULT_TILE_CARD_MOD);
}

function normalizeTileType(type) {
  if (!type || type === "hui-tile-card") return "tile";
  return type;
}

function detectTileMode(tile) {
  const features = Array.isArray(tile?.features) ? tile.features : [];
  const types = features.map((f) => f?.type).filter(Boolean);

  if (types.includes("light-brightness") && types.includes("light-color-temp")) return "full";
  if (types.includes("light-brightness")) return "brightness";
  return "toggle";
}

function buildFeaturesByMode(mode) {
  if (mode === "brightness") return [{ type: "light-brightness" }];
  if (mode === "full") return [{ type: "light-brightness" }, { type: "light-color-temp" }];
  if (mode === "toggle") return [{ type: "toggle" }];
  return undefined;
}

function normalizeTileConfig(tile) {
  const cfg = clone(tile || {});
  cfg.type = normalizeTileType(cfg.type);

  const mode = detectTileMode(cfg);
  if (!cfg.card_mod) {
    cfg.card_mod = getDefaultCardMod(mode);
  }

  return cfg;
}

function createDefaultTile(mode = "toggle") {
  const tile = {
    type: "tile",
    entity: "",
    name: "",
    card_mod: getDefaultCardMod(mode),
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
    power: { state: true }
  };

  static styles = css`
    :host {
      display: block;
      max-width: 320px;
      width: 100%;
      border-radius:24px;
      border:none !important;
    }
    ha-card{
      border-radius:24px !important;
      border:none !important;
      width: 100%;
      background: #1C1B1F;
      padding: 16px;
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
      background: linear-gradient(135deg, rgba(101, 101, 101, 0) 0%, #656565 50%, rgba(101, 101, 101, 0) 100%) !important;
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
      font-size: 24px;
      line-height: 1;
      position: relative;
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

    .power-button.on {
      background: #E65332;
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

    .disabled {
      opacity: 0.4;
      pointer-events: none;
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
  }

  setConfig(config) {
    this.config = {
      title: "Освещение",
      subtitle: "Мастер-выключатель",
      tiles: [],
      tap_action: { action: "none" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" },
      ...clone(config || {})
    };

    this.config.tiles = (this.config.tiles || []).map((tile) => normalizeTileConfig(tile));
    this._rebuildCards();
  }

  get hass() {
    return this._hass;
  }

  set hass(hass) {
    this._hass = hass;
    this._cards?.forEach((card) => {
      card.hass = hass;
    });
    this._syncPowerState();
    this.requestUpdate();
  }

  async _rebuildCards() {
    const token = ++this._buildToken;
    const tiles = Array.isArray(this.config?.tiles) ? this.config.tiles : [];

    const validTiles = tiles.filter((tile) => tile?.entity);

    if (!validTiles.length) {
      this._cards = [];
      this._syncPowerState();
      this.requestUpdate();
      return;
    }

    try {
      const helpers = await window.loadCardHelpers();
      if (token !== this._buildToken) return;

      const built = await Promise.all(
        validTiles.map(async (tile) => {
          try {
            const cfg = normalizeTileConfig(tile);
            const card = await helpers.createCardElement(cfg);
            if (this._hass) card.hass = this._hass;
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
    } catch (err) {
      console.error("emelya-light-panel-hui: rebuild error", err);
      this._cards = [];
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

    this._hass.callService("light", shouldTurnOn ? "turn_on" : "turn_off", {
      entity_id: entities
    });
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

  render() {
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
          ${this._cards.length
            ? this._cards.map((card) => html`
                <div class=${this.power ? "" : "disabled"}>
                  ${card}
                </div>
              `)
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
      ...clone(config || {})
    };

    this._config.tiles = (this._config.tiles || []).map((tile) => normalizeTileConfig(tile));

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
        { name: "subtitle", label: "Подзаголовок", selector: { text: {} } }
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
        <ha-button @click=${() => this._addTile("full")}>
          Добавить: яркость + цвет + вкл/выкл
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
              { value: "brightness", label: "Яркость + вкл/выкл" },
              { value: "full", label: "Яркость + цвет + вкл/выкл" }
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

    result.card_mod = getDefaultCardMod(editorTile.tile_type);
    result.features_position = editorTile.tile_type === "toggle" ? "inline" : undefined;

    return normalizeTileConfig(result);
  }

  _tileTypeLabel(type) {
    if (type === "full") return "Яркость + цвет + вкл/выкл";
    if (type === "brightness") return "Яркость + вкл/выкл";
    return "Только вкл/выкл";
  }

  _addTile(type) {
    const tiles = [...(this._config.tiles || [])];
    tiles.push(createDefaultTile(type));
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
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
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