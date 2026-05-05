import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";

/* ─────────────────────────────────────────
   CARD
───────────────────────────────────────── */
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
    this._preloadedBgs = new Set();
  }

  setConfig(config) {
    this.config = config || {};
    // Предзагружаем все фоны сразу при установке конфига —
    // до рендера, чтобы браузер начал качать картинки как можно раньше
    this._preloadRoomBackgrounds();
  }

  _preloadRoomBackgrounds() {
    const rooms = this.config?.rooms || [];
    rooms.forEach(room => {
      if (room.background && !this._preloadedBgs.has(room.background)) {
        this._preloadedBgs.add(room.background);
        const img = new Image();
        img.src = room.background;
      }
    });
  }

  // После каждого рендера проходим по карточкам и инициализируем фон
  updated() {
    const cards = this.renderRoot.querySelectorAll(".card[data-bg]");
    cards.forEach(el => {
      const bgUrl = el.dataset.bg;
      if (!bgUrl || el._bgInitialized === bgUrl) return;
      el._bgInitialized = bgUrl;

      el.style.setProperty("--room-bg", `url("${bgUrl}")`);

      const img = new Image();
      img.onload = () => el.classList.add("bg-loaded");
      // Если картинка уже в кэше — onload стреляет синхронно, без мигания
      img.src = bgUrl;
    });
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
      position: relative;
      /* Базовый цвет пока картинка не загружена */
      background: #1C1B1F;
      cursor: pointer;
      user-select: none;
    }

    /*
      Фон вынесен в ::before — убирает background-blend-mode с самого .card.
      background-blend-mode на элементе создаёт stacking context,
      из-за которого position:fixed у дочерних элементов ломается.
    */
    .card::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 24px;
      background-image:
        radial-gradient(179.4% 100% at 50% 0%, rgba(28, 27, 31, 0) 0%, #1C1B1F 100%),
        var(--room-bg, none);
      background-size: auto, cover;
      background-position: center;
      background-repeat: no-repeat;
      /* Плавное появление — воспринимается быстрее чем резкий pop-in */
      opacity: 0;
      transition: opacity 0.35s ease;
      pointer-events: none;
      z-index: 0;
    }

    .card.bg-loaded::before {
      opacity: 1;
    }

    /* Граница */
    .card::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 24px;
      padding: 1px;
      background: linear-gradient(135deg, rgba(101, 101, 101, 0) 0%, #656565 50%, rgba(101, 101, 101, 0) 100%) border-box;
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      z-index: 0;
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
      backdrop-filter: blur(12px);
      z-index: 1;
      flex-shrink: 0;
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
      position: relative;
      z-index: 1;
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
    if (container) container.classList.remove("dragging");
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
        if (entityId) this._fireMoreInfo(entityId);
        break;
      case "navigate":
        this._navigate(actionConfig.navigation_path);
        break;
      case "url":
        if (actionConfig.url_path) window.open(actionConfig.url_path, "_blank");
        break;
      case "call-service":
        if (!actionConfig.service) return;
        const [domain, service] = actionConfig.service.split(".");
        if (!domain || !service) return;
        this.hass.callService(domain, service, { ...(actionConfig.data || {}) });
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
      <div class="container" @mousedown=${this._onMouseDown}>
        ${rooms.map(room => {
          const temp = room.entity
            ? this.hass?.states[room.entity]?.state
            : null;

          return html`
            <div
              class="card"
              data-bg=${room.background || ""}
              @click=${() => this._onRoomClick(room)}
            >
              <div class="icon">
                <img src="${room.icon}">
              </div>
              <div class="info">
                <div class="title">${room.name}</div>
                <div class="temp">${temp ?? "--"} °C</div>
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }
}

/* ─────────────────────────────────────────
   EDITOR
───────────────────────────────────────── */
const ICON_OPTIONS = [
  { label: "Спальня",        value: "/local/images/icons/bedroom.svg" },
  { label: "Гостиная",       value: "/local/images/icons/living_room.svg" },
  { label: "Душ, ванная",    value: "/local/images/icons/bathroom.svg" },
  { label: "Детская",        value: "/local/images/icons/kids_room.svg" },
  { label: "Гардероб",       value: "/local/images/icons/wardrobe.svg" },
  { label: "Кухня",          value: "/local/images/icons/kitchen.svg" },
  { label: "Котельная",      value: "/local/images/icons/boiler_room.svg" },
  { label: "Кабинет",        value: "/local/images/icons/office.svg" },
  { label: "Постирочная",    value: "/local/images/icons/laundry.svg" },
  { label: "Туалет",         value: "/local/images/icons/toilet.svg" },
  { label: "Холл",           value: "/local/images/icons/hall.svg" },
  { label: "Кладовая",       value: "/local/images/icons/storage.svg" },
  { label: "Коридор",        value: "/local/images/icons/corridor.svg" },
  { label: "Двор",           value: "/local/images/icons/yard.svg" },
  { label: "Баня, сауна",    value: "/local/images/icons/sauna.svg" },
  { label: "Столовая",       value: "/local/images/icons/dining_room.svg" },
  { label: "Кинотеатр",      value: "/local/images/icons/home_cinema.svg" },
  { label: "Бассейн",        value: "/local/images/icons/pool.svg" },
  { label: "Гараж",          value: "/local/images/icons/garage.svg" },
  { label: "Комната няни",   value: "/local/images/icons/nanny_room.svg" },
  { label: "Прихожая",       value: "/local/images/icons/entrance.svg" },
];

class EmelyaRoomsRowEditor extends LitElement {
  static properties = {
    hass:           {},
    _config:        { state: true },
    _selectedIndex: { state: true },
    _jsonError:     { state: true },
    _uploadState:   { state: true },
    _uploadError:   { state: true },
    _dragOver:      { state: true },
  };

  static styles = css`
    :host { display: block; box-sizing: border-box; }

    .editor { display: flex; flex-direction: column; gap: 16px; }
    .toolbar { display: flex; justify-content: flex-end; }
    .toolbar button {
      border: none; border-radius: 10px; padding: 10px 14px;
      cursor: pointer; font-size: 14px; font-weight: 600;
      background: var(--primary-color); color: white;
    }

    .rooms-list { display: flex; flex-direction: column; gap: 8px; }
    .room-item {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; padding: 12px; border-radius: 14px;
      border: 1px solid var(--divider-color);
      background: var(--secondary-background-color); cursor: pointer;
    }
    .room-item.selected {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 1px var(--primary-color) inset;
    }
    .room-main { flex: 1; min-width: 0; }
    .room-name { font-weight: 600; font-size: 14px; color: var(--primary-text-color); }
    .room-sub {
      font-size: 12px; color: var(--secondary-text-color); margin-top: 4px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .room-actions { display: flex; gap: 6px; flex-shrink: 0; }
    .icon-btn {
      border: 1px solid var(--divider-color); background: var(--card-background-color);
      color: var(--primary-text-color); border-radius: 10px;
      width: 34px; height: 34px; cursor: pointer; font-size: 14px; line-height: 1;
    }

    .panel {
      display: flex; flex-direction: column; gap: 16px;
      border: 1px solid var(--divider-color); border-radius: 16px;
      padding: 16px; background: var(--card-background-color);
    }
    .section-title { font-size: 15px; font-weight: 700; margin-bottom: 4px; }

    .field { display: flex; flex-direction: column; gap: 6px; }
    .field label { font-size: 13px; font-weight: 600; color: var(--primary-text-color); }
    .field input, .field select, .field textarea {
      width: 100%; box-sizing: border-box; border: 1px solid var(--divider-color);
      border-radius: 10px; padding: 10px 12px;
      background: var(--secondary-background-color);
      color: var(--primary-text-color); font: inherit;
    }
    .field textarea { min-height: 110px; resize: vertical; font-family: monospace; }

    .error { font-size: 12px; color: var(--error-color, #db4437); }
    .hint  { font-size: 12px; color: var(--secondary-text-color); }
    .empty {
      padding: 20px; border: 1px dashed var(--divider-color); border-radius: 16px;
      color: var(--secondary-text-color); text-align: center;
    }

    .img-field { display: flex; flex-direction: column; gap: 10px; }
    .img-label { font-size: 13px; font-weight: 600; color: var(--primary-text-color); }
    .img-preview {
      width: 100%; height: 120px; border-radius: 16px; overflow: hidden;
      background: #1C1B1F; border: 1px solid rgba(101,101,101,0.3);
      display: flex; align-items: center; justify-content: center;
    }
    .img-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .img-preview-empty {
      font-size: 12px; color: var(--secondary-text-color);
      text-align: center; padding: 12px; line-height: 1.5;
    }

    .drop-zone {
      width: 100%; box-sizing: border-box; min-height: 80px;
      border: 2px dashed var(--divider-color); border-radius: 14px;
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 6px; padding: 12px; cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      background: var(--secondary-background-color); text-align: center;
    }
    .drop-zone.dragover {
      border-color: var(--primary-color);
      background: color-mix(in srgb, var(--primary-color) 10%, transparent);
    }
    .drop-zone.loading { opacity: 0.6; pointer-events: none; }
    .drop-icon { font-size: 24px; line-height: 1; }
    .drop-text { font-size: 13px; color: var(--primary-text-color); line-height: 1.4; }
    .drop-sub  { font-size: 11px; color: var(--secondary-text-color); }
    .drop-btn {
      margin-top: 2px; padding: 5px 12px; border-radius: 8px;
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
    this._config = { rooms: [] };
    this._selectedIndex = 0;
    this._jsonError = "";
    this._uploadState = "idle";
    this._uploadError = "";
    this._dragOver = false;
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

  _getRoomSchema() {
    return [
      { name: "name",   label: "Название",           selector: { text: {} } },
      { name: "entity", label: "Entity температуры", selector: { entity: { domain: ["sensor", "climate", "input_number"] } } },
    ];
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
    this.shadowRoot?.getElementById("bgFileInput")?.click();
  }

  _onFileInput(e) {
    const file = e.target?.files?.[0];
    if (file) this._uploadFile(file);
    e.target.value = "";
  }

  /*
    HA API отклоняет image/avif (и некоторые другие форматы) с HTTP 400.
    Решение: подменяем MIME-тип на image/png перед отправкой.
    Бинарные данные файла остаются нетронутыми — сервер сохраняет байты как есть.
    Браузер при отображении читает файл по реальным байтам (magic bytes),
    игнорируя Content-Type с которым файл был загружен, так что avif корректно отобразится.
  */
  _normalizeFileForUpload(file) {
    const unsupportedByHA = ["image/avif", "image/jxl", "image/heic", "image/heif"];
    if (unsupportedByHA.includes(file.type)) {
      return new File([file], file.name, { type: "image/png" });
    }
    return file;
  }

  async _uploadFile(file) {
    if (!file.type.startsWith("image/")) {
      this._uploadState = "error";
      this._uploadError = "Файл не является изображением";
      return;
    }

    this._uploadState = "loading";
    this._uploadError = "";

    const uploadFile = this._normalizeFileForUpload(file);

    // Attempt 1 — HA store_image
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const resp = await this.hass.fetchWithAuth(
        `/api/config/core/store_image`,
        { method: "POST", body: formData }
      );

      if (resp.ok) {
        const json = await resp.json();
        this._setRoomBackground(json.url || `/local/${file.name}`);
        this._uploadState = "success";
        return;
      }
    } catch (_) {}

    // Attempt 2 — /api/image/upload fallback
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
        this._setRoomBackground(`/api/image/serve/${json.id}/original`);
        this._uploadState = "success";
        return;
      }

      throw new Error(`HTTP ${resp.status}`);
    } catch (err) {
      this._uploadState = "error";
      this._uploadError = `Не удалось загрузить файл (${err.message}). Поместите файл вручную в config/www/ и укажите путь.`;
    }
  }

  _setRoomBackground(path) {
    const rooms = [...(this._config.rooms || [])];
    rooms[this._selectedIndex] = { ...rooms[this._selectedIndex], background: path };
    this._config = { ...this._config, rooms };
    this._emitConfig();
  }

  _clearRoomBackground() {
    this._uploadState = "idle";
    this._uploadError = "";
    const rooms = [...(this._config.rooms || [])];
    const room = { ...rooms[this._selectedIndex] };
    delete room.background;
    rooms[this._selectedIndex] = room;
    this._config = { ...this._config, rooms };
    this._emitConfig();
  }

  _renderBgUpload(room) {
    const src = room?.background;
    return html`
      <div class="img-field">
        <div class="img-label">Фоновое изображение</div>

        <div class="img-preview">
          ${src ? html`
            <img src=${src} alt="preview"
              @error=${() => { this._uploadState = "error"; this._uploadError = "Файл не найден"; }} />
          ` : html`
            <div class="img-preview-empty">Фон не задан.<br>Будет использован пустой фон.</div>
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
          <div class="drop-sub">PNG, JPG, WebP, AVIF, SVG</div>
          ${this._uploadState !== "loading" ? html`
            <button class="drop-btn" @click=${this._onZoneClick}>Выбрать файл</button>
          ` : ""}
        </div>

        <input type="file" id="bgFileInput" accept="image/*" @change=${this._onFileInput} />

        ${this._uploadState === "success" ? html`<div class="status-row success">✓ Изображение загружено</div>` : ""}
        ${this._uploadState === "error"   ? html`<div class="status-row error">⚠ ${this._uploadError}</div>` : ""}

        ${src ? html`
          <div class="current-path">
            <span title=${src}>${src}</span>
            <button class="path-clear" @click=${this._clearRoomBackground.bind(this)}>✕</button>
          </div>
        ` : ""}

        <div class="img-hint">
          Файл сохраняется в <code>config/www/</code> и доступен по пути <code>/local/имя_файла</code>.
          Поддерживаются PNG, JPG, WebP и AVIF.
        </div>
      </div>
    `;
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
            ? rooms.map((room, index) => html`
                <div
                  class="room-item ${this._selectedIndex === index ? "selected" : ""}"
                  @click=${() => this._selectRoom(index)}
                >
                  <div class="room-main">
                    <div class="room-name">${room.name || `Комната ${index + 1}`}</div>
                    <div class="room-sub">${room.entity || "Температурная сущность не выбрана"}</div>
                  </div>
                  <div class="room-actions" @click=${this._stopPropagation}>
                    <button class="icon-btn" ?disabled=${index === 0}                @click=${() => this._moveRoom(index, -1)}>↑</button>
                    <button class="icon-btn" ?disabled=${index === rooms.length - 1} @click=${() => this._moveRoom(index, 1)}>↓</button>
                    <button class="icon-btn"                                         @click=${() => this._removeRoom(index)}>✕</button>
                  </div>
                </div>
              `)
            : html`<div class="empty">Пока нет ни одной комнаты. Нажми «Добавить комнату».</div>`}
        </div>

        ${selected ? html`
          <div class="panel">
            <div class="section-title">Основные настройки</div>

            <ha-form
              .hass=${this.hass}
              .data=${{ name: selected.name || "", entity: selected.entity || "" }}
              .schema=${this._getRoomSchema()}
              @value-changed=${this._onRoomFormChanged}
            ></ha-form>

            <div class="field">
              <label>Иконка</label>
              <div style="display:flex; align-items:center; gap:10px;">
                ${selected.icon ? html`
                  <div style="width:40px;height:40px;border-radius:12px;background:#28272C;
                    border:1px solid #4D4A54;display:flex;align-items:center;
                    justify-content:center;flex-shrink:0;">
                    <img src=${selected.icon} style="width:20px;height:20px;filter:brightness(0) invert(1);object-fit:contain;" />
                  </div>
                ` : ''}
                <select style="flex:1;" .value=${selected.icon || ""} @change=${this._onIconChange}>
                  <option value="">— Выберите иконку —</option>
                  ${ICON_OPTIONS.map(opt => html`
                    <option value=${opt.value} ?selected=${selected.icon === opt.value}>${opt.label}</option>
                  `)}
                </select>
              </div>
            </div>

            <div class="section-title">Фон карточки</div>
            ${this._renderBgUpload(selected)}

            <div class="section-title">Взаимодействие</div>

            <div class="field">
              <label>Действие по нажатию</label>
              <select .value=${selected.tap_action?.action || "none"} @change=${this._onActionTypeChange}>
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
                <input .value=${selected.tap_action?.service || ""}
                  @input=${(e) => this._updateActionField("service", e.target.value)}
                  placeholder="light.turn_on" />
              </div>
              <div class="field">
                <label>Service data (JSON)</label>
                <textarea .value=${this._formatJson(selected.tap_action?.data)}
                  @input=${this._onActionDataInput}
                  placeholder='{"brightness": 150}'></textarea>
                ${this._jsonError
                  ? html`<div class="error">${this._jsonError}</div>`
                  : html`<div class="hint">Оставь пустым, если дополнительные данные не нужны.</div>`}
              </div>
            ` : ""}

            ${selected.tap_action?.action === "navigate" ? html`
              <div class="field">
                <label>Путь навигации</label>
                <input .value=${selected.tap_action?.navigation_path || ""}
                  @input=${(e) => this._updateActionField("navigation_path", e.target.value)}
                  placeholder="/lovelace/rooms" />
              </div>
            ` : ""}

            ${selected.tap_action?.action === "url" ? html`
              <div class="field">
                <label>URL</label>
                <input .value=${selected.tap_action?.url_path || ""}
                  @input=${(e) => this._updateActionField("url_path", e.target.value)}
                  placeholder="https://example.com" />
              </div>
            ` : ""}
          </div>
        ` : ""}
      </div>
    `;
  }

  _stopPropagation(e) { e.stopPropagation(); }

  _selectRoom(index) {
    this._selectedIndex = index;
    this._jsonError = "";
    this._uploadState = "idle";
    this._uploadError = "";
    this._dragOver = false;
  }

  _addRoom = () => {
    const rooms = [...(this._config.rooms || [])];
    rooms.push({ name: `Комната ${rooms.length + 1}`, entity: "", icon: "", background: "", tap_action: { action: "none" } });
    this._config = { ...this._config, rooms };
    this._selectedIndex = rooms.length - 1;
    this._uploadState = "idle";
    this._uploadError = "";
    this._emitConfig();
  };

  _removeRoom(index) {
    const rooms = [...(this._config.rooms || [])];
    rooms.splice(index, 1);
    this._config = { ...this._config, rooms };
    if (this._selectedIndex >= rooms.length) this._selectedIndex = Math.max(0, rooms.length - 1);
    this._uploadState = "idle";
    this._uploadError = "";
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

  _onIconChange = (e) => {
    const rooms = [...(this._config.rooms || [])];
    rooms[this._selectedIndex] = { ...rooms[this._selectedIndex], icon: e.target.value };
    this._config = { ...this._config, rooms };
    this._emitConfig();
  };

  _onRoomFormChanged = (e) => {
    const updated = e.detail.value;
    const rooms = [...(this._config.rooms || [])];
    rooms[this._selectedIndex] = {
      ...rooms[this._selectedIndex],
      ...updated,
      background: rooms[this._selectedIndex].background
    };
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
    if (value === "") { delete tap_action[field]; } else { tap_action[field] = value; }
    room.tap_action = tap_action;
    rooms[this._selectedIndex] = room;
    this._config = { ...this._config, rooms };
    this._emitConfig();
  }

  _onActionDataInput = (e) => {
    const value = e.target.value.trim();
    if (!value) { this._setActionData({}); this._jsonError = ""; return; }
    try { this._setActionData(JSON.parse(value)); this._jsonError = ""; }
    catch (_) { this._jsonError = "Невалидный JSON"; }
  };

  _setActionData(data) {
    const rooms = [...(this._config.rooms || [])];
    const room = { ...(rooms[this._selectedIndex] || {}) };
    room.tap_action = { ...(room.tap_action || {}), data };
    rooms[this._selectedIndex] = room;
    this._config = { ...this._config, rooms };
    this._emitConfig();
  }

  _formatJson(value) {
    if (!value || (typeof value === "object" && !Object.keys(value).length)) return "";
    try { return JSON.stringify(value, null, 2); } catch (_) { return ""; }
  }

  _emitConfig() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    }));
  }
}

/* ─────────────────────────────────────────
   REGISTRATION
───────────────────────────────────────── */
EmelyaRoomsRow.getConfigElement = function () {
  return document.createElement("emelya-rooms-row-editor");
};

EmelyaRoomsRow.getStubConfig = function () {
  return {
    rooms: [
      { name: "Гостиная", entity: "", icon: "", background: "", tap_action: { action: "none" } }
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