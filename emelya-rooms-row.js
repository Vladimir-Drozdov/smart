import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";

class EmelyaRoomsRow extends LitElement {
  static properties = {
    hass: {},
    config: {}
  };

  constructor() {
    super();
    this.isDragging = false;
    this.dragStarted = false;
    this.startX = 0;
    this.startScrollLeft = 0;
  }

  setConfig(config) {
    this.config = config || {};
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .container {
      display: flex;
      flex-direction: row;
      gap: 8px;
      overflow-x: scroll;
      overflow-y: hidden;
      cursor: grab;
      scrollbar-width: none;
    }

    .container::-webkit-scrollbar {
      display: none;
    }

    .container.dragging {
      cursor: grabbing;
    }

    .card {
      width: 280px;
      min-width: 280px;
      height: 140px;
      border-radius: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 48px 28px 16px 16px;
      box-sizing: border-box;
      color: white;
    }

    .icon {
      width: 64px;
      height: 64px;
      border-radius: 20px;
      background: rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      position: relative;
      justify-content: center;
    }
    .icon::before {
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

    .icon img {
      width: 24px;
      height: 24px;
      filter: brightness(0) invert(1);
    }

    .info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      padding-left: 8px;
    }

    .title {
      font-size: 16px;
      font-weight: 600;
    }

    .temp {
      font-size: 15px;
      color: rgba(255,255,255,0.6);
    }
  `;

  _onMouseDown(e) {
    const container = this.renderRoot.querySelector('.container');
    this.dragStarted = false;
    this.startX = e.pageX;
    this.startScrollLeft = container.scrollLeft;
    this._dragStartTime = Date.now();
    this._dragStartX = e.pageX;
    document.addEventListener("mousemove", this._onMouseMove);
    document.addEventListener("mouseup", this._onMouseUp);
  }

  _onMouseMove = (e) => {
    const container = this.renderRoot.querySelector('.container');
    if (!container) return;
    const moveX = Math.abs(e.pageX - this._dragStartX);
    const moveTime = Date.now() - this._dragStartTime;
    if (!this.dragStarted && (moveX > 5 || moveTime > 200)) {
      this.dragStarted = true;
      container.classList.add("dragging");
    }
    if (this.dragStarted) {
      e.preventDefault();
      const walk = (e.pageX - this.startX) * 1.5;
      container.scrollLeft = this.startScrollLeft - walk;
    }
  };

  _onMouseUp = () => {
    const container = this.renderRoot.querySelector('.container');
    if (container) {
      container.classList.remove("dragging");
    }
    document.removeEventListener("mousemove", this._onMouseMove);
    document.removeEventListener("mouseup", this._onMouseUp);
    this._dragStartTime = null;
    this.dragStarted = false;
  };

  _fireMoreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId },
      bubbles: true,
      composed: true
    }));
  }

  _navigate(path) {
    if (!path) return;
    history.pushState(null, "", path);
    window.dispatchEvent(new Event("location-changed"));
  }

  _handleAction(actionConfig, room) {
    if (!actionConfig || !this.hass) return;
    const entityId = actionConfig.entity || room.entity;

    switch (actionConfig.action) {
      case "more-info":
        if (entityId) {
          this._fireMoreInfo(entityId);
        }
        break;

      case "navigate":
        this._navigate(actionConfig.navigation_path);
        break;

      case "url":
        if (actionConfig.url_path) {
          window.open(actionConfig.url_path, "_blank");
        }
        break;

      case "call-service":
        if (!actionConfig.service) return;
        const [domain, service] = actionConfig.service.split(".");
        if (!domain || !service) return;
        const serviceData = { ...(actionConfig.data || {}) };
        this.hass.callService(domain, service, serviceData);
        break;

      case "none":
      default:
        break;
    }
  }

  _onRoomClick(room) {
    if (this.dragStarted) return;
    this._handleAction(room.tap_action, room);
  }

  render() {
    if (!this.config) return html``;
    const rooms = this.config.rooms || [];

    return html`
      <div
        class="container"
        @mousedown=${this._onMouseDown}
      >
        ${rooms.map(room => {
          const temp = room.entity
            ? this.hass?.states[room.entity]?.state
            : null;

          return html`
            <div
              class="card"
              style="
                background-image:
                  radial-gradient(179.4% 100% at 50% 0%, rgba(28, 27, 31, 0) 0%, #1C1B1F 100%),
                  url(${room.background}),
                  linear-gradient(135deg, rgba(101, 101, 101, 0) 0%, #656565 50%, rgba(101, 101, 101, 0) 100%);
                background-size: auto, cover, auto;
                background-position: center;
                background-repeat: no-repeat;
                border: 1px solid transparent;
                background-origin: border-box;
                background-clip: padding-box, padding-box, border-box;
              "
              @click=${() => this._onRoomClick(room)}
            >
              <div class="icon">
                <img src="${room.icon}">
              </div>
              <div class="info">
                <div class="title">${room.name}</div>
                <div class="temp">
                  ${temp ?? "--"} °C
                </div>
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }
}

class EmelyaRoomsRowEditor extends LitElement {
  static properties = {
    hass: {},
    _config: { state: true },
    _selectedIndex: { state: true },
    _jsonError: { state: true }
  };

  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
    }

    .editor {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .toolbar {
      display: flex;
      justify-content: flex-end;
    }

    .toolbar button {
      border: none;
      border-radius: 10px;
      padding: 10px 14px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      background: var(--primary-color);
      color: white;
    }

    .rooms-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .room-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px;
      border-radius: 14px;
      border: 1px solid var(--divider-color);
      background: var(--secondary-background-color);
      cursor: pointer;
    }

    .room-item.selected {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 1px var(--primary-color) inset;
    }

    .room-main {
      flex: 1;
      min-width: 0;
    }

    .room-name {
      font-weight: 600;
      font-size: 14px;
      color: var(--primary-text-color);
    }

    .room-sub {
      font-size: 12px;
      color: var(--secondary-text-color);
      margin-top: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .room-actions {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }

    .icon-btn {
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      border-radius: 10px;
      width: 34px;
      height: 34px;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
    }

    .panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
      border: 1px solid var(--divider-color);
      border-radius: 16px;
      padding: 16px;
      background: var(--card-background-color);
    }

    .section-title {
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field label {
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-text-color);
    }

    .field input,
    .field select,
    .field textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      padding: 10px 12px;
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      font: inherit;
    }

    .field textarea {
      min-height: 110px;
      resize: vertical;
      font-family: monospace;
    }

    .error {
      font-size: 12px;
      color: var(--error-color, #db4437);
    }

    .hint {
      font-size: 12px;
      color: var(--secondary-text-color);
    }

    .empty {
      padding: 20px;
      border: 1px dashed var(--divider-color);
      border-radius: 16px;
      color: var(--secondary-text-color);
      text-align: center;
    }
  `;

  constructor() {
    super();
    this._config = { rooms: [] };
    this._selectedIndex = 0;
    this._jsonError = "";
  }

  setConfig(config) {
    this._config = {
      ...config,
      rooms: Array.isArray(config?.rooms) ? [...config.rooms] : []
    };
    if (this._selectedIndex >= this._config.rooms.length) {
      this._selectedIndex = Math.max(0, this._config.rooms.length - 1);
    }
  }

  // Build ha-form schema for the selected room
  _getRoomSchema(room) {
    const action = room?.tap_action?.action || "none";
    const baseSchema = [
      {
        name: "name",
        label: "Название",
        selector: { text: {} }
      },
      {
        name: "entity",
        label: "Entity температуры",
        selector: { entity: { domain: ["sensor", "climate", "input_number"] } }
      },
      {
        name: "icon",
        label: "Иконка (путь к файлу)",
        selector: { text: {} }
      },
      {
        name: "background",
        label: "Фон (путь к файлу)",
        selector: { text: {} }
      }
    ];
    return baseSchema;
  }

  render() {
    const rooms = this._config?.rooms || [];
    const selected = rooms[this._selectedIndex];

    return html`
      <div class="editor">
        <div class="toolbar">
          <button @click=${this._addRoom}>+ Добавить комнату</button>
        </div>

        <div class="rooms-list">
          ${rooms.length
            ? rooms.map(
                (room, index) => html`
                  <div
                    class="room-item ${this._selectedIndex === index ? "selected" : ""}"
                    @click=${() => this._selectRoom(index)}
                  >
                    <div class="room-main">
                      <div class="room-name">
                        ${room.name || `Комната ${index + 1}`}
                      </div>
                      <div class="room-sub">
                        ${room.entity || "Температурная сущность не выбрана"}
                      </div>
                    </div>
                    <div class="room-actions" @click=${this._stopPropagation}>
                      <button
                        class="icon-btn"
                        title="Вверх"
                        ?disabled=${index === 0}
                        @click=${() => this._moveRoom(index, -1)}
                      >↑</button>
                      <button
                        class="icon-btn"
                        title="Вниз"
                        ?disabled=${index === rooms.length - 1}
                        @click=${() => this._moveRoom(index, 1)}
                      >↓</button>
                      <button
                        class="icon-btn"
                        title="Удалить"
                        @click=${() => this._removeRoom(index)}
                      >✕</button>
                    </div>
                  </div>
                `
              )
            : html`<div class="empty">Пока нет ни одной комнаты. Нажми «Добавить комнату».</div>`}
        </div>

        ${selected ? html`
          <div class="panel">
            <div class="section-title">Основные настройки комнаты</div>

            <!-- Entity selector fields via ha-form -->
            <ha-form
              .hass=${this.hass}
              .data=${{ name: selected.name || "", entity: selected.entity || "", icon: selected.icon || "", background: selected.background || "" }}
              .schema=${this._getRoomSchema(selected)}
              @value-changed=${this._onRoomFormChanged}
            ></ha-form>

            <div class="section-title">Взаимодействие</div>

            <div class="field">
              <label>Действие по нажатию</label>
              <select
                .value=${selected.tap_action?.action || "none"}
                @change=${this._onActionTypeChange}
              >
                <option value="none">Нет</option>
                <option value="more-info">more-info</option>
                <option value="navigate">navigate</option>
                <option value="url">url</option>
                <option value="call-service">call-service</option>
              </select>
            </div>

            ${selected.tap_action?.action === "call-service" ? html`
              <div class="field">
                <label>Сервис</label>
                <input
                  .value=${selected.tap_action?.service || ""}
                  @input=${(e) => this._updateActionField("service", e.target.value)}
                  placeholder="light.turn_on"
                />
              </div>

              <div class="field">
                <label>Service data (JSON)</label>
                <textarea
                  .value=${this._formatJson(selected.tap_action?.data)}
                  @input=${this._onActionDataInput}
                  placeholder='{"brightness": 150}'
                ></textarea>
                ${this._jsonError
                  ? html`<div class="error">${this._jsonError}</div>`
                  : html`<div class="hint">Оставь пустым, если дополнительные данные не нужны.</div>`}
              </div>
            ` : ""}

            ${selected.tap_action?.action === "navigate" ? html`
              <div class="field">
                <label>Путь навигации</label>
                <input
                  .value=${selected.tap_action?.navigation_path || ""}
                  @input=${(e) => this._updateActionField("navigation_path", e.target.value)}
                  placeholder="/lovelace/rooms"
                />
              </div>
            ` : ""}

            ${selected.tap_action?.action === "url" ? html`
              <div class="field">
                <label>URL</label>
                <input
                  .value=${selected.tap_action?.url_path || ""}
                  @input=${(e) => this._updateActionField("url_path", e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            ` : ""}
          </div>
        ` : ""}
      </div>
    `;
  }

  _stopPropagation(e) {
    e.stopPropagation();
  }

  _selectRoom(index) {
    this._selectedIndex = index;
    this._jsonError = "";
  }

  _addRoom = () => {
    const rooms = [...(this._config.rooms || [])];
    rooms.push({
      name: `Комната ${rooms.length + 1}`,
      entity: "",
      icon: "",
      background: "",
      tap_action: { action: "none" }
    });
    this._config = { ...this._config, rooms };
    this._selectedIndex = rooms.length - 1;
    this._emitConfig();
  };

  _removeRoom(index) {
    const rooms = [...(this._config.rooms || [])];
    rooms.splice(index, 1);
    this._config = { ...this._config, rooms };
    if (this._selectedIndex >= rooms.length) {
      this._selectedIndex = Math.max(0, rooms.length - 1);
    }
    this._emitConfig();
  }

  _moveRoom(index, direction) {
    const newIndex = index + direction;
    const rooms = [...(this._config.rooms || [])];
    if (newIndex < 0 || newIndex >= rooms.length) return;
    [rooms[index], rooms[newIndex]] = [rooms[newIndex], rooms[index]];
    this._config = { ...this._config, rooms };
    this._selectedIndex = newIndex;
    this._emitConfig();
  }

  // Handle changes from ha-form (name, entity, icon, background)
  _onRoomFormChanged = (e) => {
    const updated = e.detail.value;
    const rooms = [...(this._config.rooms || [])];
    const room = { ...rooms[this._selectedIndex], ...updated };
    rooms[this._selectedIndex] = room;
    this._config = { ...this._config, rooms };
    this._emitConfig();
  };

  _onActionTypeChange = (e) => {
    const action = e.target.value;
    const rooms = [...(this._config.rooms || [])];
    const room = { ...(rooms[this._selectedIndex] || {}) };

    const actionMap = {
      "none":         { action: "none" },
      "more-info":    { action: "more-info" },
      "navigate":     { action: "navigate", navigation_path: "" },
      "url":          { action: "url", url_path: "" },
      "call-service": { action: "call-service", service: "", data: {} }
    };

    room.tap_action = actionMap[action] || { action: "none" };
    rooms[this._selectedIndex] = room;
    this._config = { ...this._config, rooms };
    this._jsonError = "";
    this._emitConfig();
  };

  _updateActionField(field, value) {
    const rooms = [...(this._config.rooms || [])];
    const room = { ...(rooms[this._selectedIndex] || {}) };
    const tap_action = { ...(room.tap_action || {}) };
    if (value === "") {
      delete tap_action[field];
    } else {
      tap_action[field] = value;
    }
    room.tap_action = tap_action;
    rooms[this._selectedIndex] = room;
    this._config = { ...this._config, rooms };
    this._emitConfig();
  }

  _onActionDataInput = (e) => {
    const value = e.target.value.trim();
    if (!value) {
      this._setActionData({});
      this._jsonError = "";
      return;
    }
    try {
      const parsed = JSON.parse(value);
      this._setActionData(parsed);
      this._jsonError = "";
    } catch (err) {
      this._jsonError = "Невалидный JSON";
    }
  };

  _setActionData(data) {
    const rooms = [...(this._config.rooms || [])];
    const room = { ...(rooms[this._selectedIndex] || {}) };
    const tap_action = { ...(room.tap_action || {}) };
    tap_action.data = data;
    room.tap_action = tap_action;
    rooms[this._selectedIndex] = room;
    this._config = { ...this._config, rooms };
    this._emitConfig();
  }

  _formatJson(value) {
    if (!value || (typeof value === "object" && !Object.keys(value).length)) return "";
    try {
      return JSON.stringify(value, null, 2);
    } catch (_) {
      return "";
    }
  }

  _emitConfig() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    }));
  }
}

/* РЕГИСТРАЦИЯ */

EmelyaRoomsRow.getConfigElement = function () {
  return document.createElement("emelya-rooms-row-editor");
};

EmelyaRoomsRow.getStubConfig = function () {
  return {
    rooms: [
      {
        name: "Гостиная",
        entity: "",
        icon: "",
        background: "",
        tap_action: { action: "none" }
      }
    ]
  };
};

if (!customElements.get("emelya-rooms-row-editor")) {
  customElements.define("emelya-rooms-row-editor", EmelyaRoomsRowEditor);
}

if (!customElements.get("emelya-rooms-row")) {
  customElements.define("emelya-rooms-row", EmelyaRoomsRow);
}

window.customCards = window.customCards || [];
if (!window.customCards.find((card) => card.type === "custom:emelya-rooms-row")) {
  window.customCards.push({
    type: "custom:emelya-rooms-row",
    name: "Emelya Rooms Row",
    description: "Горизонтальный ряд карточек комнат",
    preview: true
  });
}