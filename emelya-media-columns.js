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
    tvPlaying: { state: true },
    tvVolume: { state: true },
    speakerOn: { state: true },
    speakerPlaying: { state: true },
    speakerMuted: { state: true },
    speakerVolume: { state: true },
  };

  constructor() {
    super();
    this.tvOn = false;
    this.tvPlaying = false;
    this.tvVolume = 0;
    this.speakerOn = false;
    this.speakerPlaying = false;
    this.speakerMuted = false;
    this.speakerVolume = 0;
    this._expectedTv = null;
    this._expectedSpeaker = null;
    this._holdTimer = null;
    this._lastTap = 0;
    // Предзагрузка
    this._preloadedBgs = new Set();
  }

  setConfig(config) {
    this.config = {
      tap_action: { action: "more-info" },
      hold_action: { action: "none" },
      double_tap_action: { action: "none" },
      ...config,
    };
    this.base = this.config.base_path || "/local";
    this._preloadBackgrounds();
  }

  _preloadBackgrounds() {
    const bgs = [
      this.config.speaker_bg || `${this.base}/images/container-images/background-alice.png`,
      this.config.tv_bg      || `${this.base}/images/container-images/background-tv.png`,
    ];
    bgs.forEach(bg => {
      if (bg && !this._preloadedBgs.has(bg)) {
        this._preloadedBgs.add(bg);
        const img = new Image();
        img.src = bg;
      }
    });
  }

  // После рендера инициализируем фоны обоих столбцов
  updated() {
    const columns = this.renderRoot?.querySelectorAll(".column[data-bg]");
    columns?.forEach(el => {
      const bgUrl = el.dataset.bg;
      if (!bgUrl || el._bgInitialized === bgUrl) return;
      el._bgInitialized = bgUrl;
      el.style.setProperty("--col-bg", `url("${bgUrl}")`);
      const img = new Image();
      img.onload = () => el.classList.add("bg-loaded");
      img.src = bgUrl;
    });
  }

  set hass(hass) {
    this._hass = hass;

    // ТВ
    const tvEntity = this.config?.tv;
    if (tvEntity) {
      const tvState = hass.states?.[tvEntity];
      if (tvState) {
        const newTvOn = tvState.state !== "off" && tvState.state !== "unavailable";
        const newTvPlaying = tvState.state === "playing";

        if (this._expectedTv !== null) {
          if (newTvOn === this._expectedTv) {
            this._expectedTv = null;
            this.tvOn = newTvOn;
          }
        } else {
          this.tvOn = newTvOn;
        }

        this.tvPlaying = newTvPlaying;

        const volume = tvState.attributes?.volume_level;
        if (volume !== undefined) this.tvVolume = Math.round(volume * 100);
      }
    }

    // Колонка Алиса
    const speakerEntity = this.config?.speaker;
    if (speakerEntity) {
      const speakerState = hass.states?.[speakerEntity];
      if (speakerState) {
        const newSpeakerOn = speakerState.state !== "off" && speakerState.state !== "unavailable";
        const newSpeakerPlaying = speakerState.state === "playing";

        if (this._expectedSpeaker !== null) {
          if (newSpeakerOn === this._expectedSpeaker) {
            this._expectedSpeaker = null;
            this.speakerOn = newSpeakerOn;
          }
        } else {
          this.speakerOn = newSpeakerOn;
        }

        this.speakerPlaying = newSpeakerPlaying;
        this.speakerMuted = speakerState.attributes?.is_volume_muted ?? false;

        const volume = speakerState.attributes?.volume_level;
        if (volume !== undefined) this.speakerVolume = Math.round(volume * 100);
      }
    }
  }

  get hass() {
    return this._hass;
  }

  static styles = css`
    :host { 
      display: block; 
      max-width: 450px; 
      min-width: 320px;
      width: 100%; 
      font-family: Roboto, sans-serif; 
      color: white; 
      min-height: 1px;
    }

    .wrapper {
      display: flex;
      gap: 8px;
      max-width: 100%;
      min-height: 1px;
    }

    .column {
      min-height: 1px;
      width: 50%; 
      height: 280px; 
      border-radius: 24px; 
      padding: 16px; 
      box-sizing: border-box;
      display: flex; 
      flex-direction: column; 
      justify-content: space-between;
      color: white;
      cursor: pointer;
      user-select: none;
      position: relative;
      overflow: hidden;
      /* Базовый цвет пока картинка не загружена */
      background: #1C1B1F;
    }

    /*
      Фон вынесен в ::before — убирает background-blend-mode с самого .column.
      background-blend-mode на элементе создаёт stacking context,
      из-за которого position:fixed у дочерних элементов ломается.
    */
    .column::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 24px;
      background-image:
        linear-gradient(180deg, #000000 0%, rgba(0,0,0,0.35) 40%, #000000 100%),
        var(--col-bg, none);
      background-size: auto, cover;
      background-position: center;
      background-repeat: no-repeat;
      background-blend-mode: normal, luminosity;
      /* Плавное появление */
      opacity: 0;
      transition: opacity 0.35s ease;
      pointer-events: none;
      z-index: 0;
    }

    .column.bg-loaded::before {
      opacity: 1;
    }

    /* Граница */
    .column::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 24px;
      padding: 1px;
      background: linear-gradient(291.96deg, #4D4A54 0%, #1C1B1F 50%, #4D4A54 100%) border-box;
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      z-index: 0;
    }

    /* ТВ-колонка — другой градиент поверх фона */
    .column.tv::before {
      background-image:
        linear-gradient(180deg, rgba(0,0,0,0) 0%, #000000 100%),
        var(--col-bg, none);
      background-blend-mode: normal, luminosity;
    }

    .controls { 
      display: flex; 
      flex-direction: column; 
      gap: 8px;
      position: relative;
      z-index: 2;
    }

    .control {
      position: relative;
      border-radius: 16px;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      cursor: pointer;
      transition: background 0.2s ease;
      background: rgba(255, 255, 255, 0.10);
      backdrop-filter: blur(12px);
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

    .control svg {
      width: 22px; 
      height: 22px;
      fill: white;
      flex-shrink: 0;
    }

    .control.active { 
      background: #4D4A54; 
    }

    .control.muted {
      background: rgba(255, 255, 255, 0.22);
    }

    .title-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px 6px 12px;
      background: #1C1B1F;
      border-radius: 100px;
      width: fit-content;
      z-index: 2;
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

    .title-text { 
      font-size: 16px; 
      font-weight: 500; 
      color: white;
    }

    .circle { 
      width: 10px; 
      height: 10px; 
      border-radius: 50%; 
      flex-shrink: 0;
      transition: background 0.3s ease;
    }

    .circle.on  { background: #7FB800; }
    .circle.off { background: #D32F2F; }

    .volume-section {
      position: relative;
      z-index: 2;
    }

    .volume-label {
      font-size: 12px;
      font-weight: 700;
      text-align: right;
      margin-bottom: 2px;
      opacity: 0.9;
    }

    .volume-value {
      font-size: 45px;
      font-weight: 600;
      text-align: right;
      line-height: 1;
      letter-spacing: -1px;
    }

    .alice-img {
      position: absolute;
      top: -32px;
      left: 25px;
      width: 168px;
      height: 168px;
      pointer-events: none;
      z-index: 1;
    }
    .alice-img img {
      width: 100%;
      height: 100%;
      object-fit: contain;
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
    if (e.target.closest('.control')) return;
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
    if (e.target.closest('.control')) return;
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
    if (!this.hass || !this.config) return;
    handleAction(this, this.hass, this.config, actionType);
  }

  _fireMoreInfo(entityId) {
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId },
      bubbles: true,
      composed: true
    }));
  }

  /* ── TV Actions ── */
  toggleTv() {
    const entity = this.config?.tv;
    if (!entity || !this.hass?.states?.[entity]) return;
    const newState = !this.tvOn;
    this.tvOn = newState;
    this._expectedTv = newState;
    const service = newState ? "turn_on" : "turn_off";
    this.hass.callService("media_player", service, { entity_id: entity });
  }

  toggleTvPlay() {
    const entity = this.config?.tv;
    if (!entity || !this.hass?.states?.[entity]) return;
    if (!this.tvOn) return;
    if (this.tvPlaying) {
      this.tvPlaying = false;
      this.hass.callService("media_player", "media_pause", { entity_id: entity });
    } else {
      this.tvPlaying = true;
      this.hass.callService("media_player", "media_play", { entity_id: entity });
    }
  }

  /* ── Speaker Actions ── */
  toggleSpeaker() {
    const entity = this.config?.speaker;
    if (!entity || !this.hass?.states?.[entity]) return;
    const newState = !this.speakerOn;
    this.speakerOn = newState;
    this._expectedSpeaker = newState;
    const service = newState ? "turn_on" : "turn_off";
    this.hass.callService("media_player", service, { entity_id: entity });
  }

  toggleSpeakerPlay() {
    const entity = this.config?.speaker;
    if (!entity || !this.hass?.states?.[entity]) return;
    if (!this.speakerOn) return;
    if (this.speakerPlaying) {
      this.speakerPlaying = false;
      this.hass.callService("media_player", "media_pause", { entity_id: entity });
    } else {
      this.speakerPlaying = true;
      this.hass.callService("media_player", "media_play", { entity_id: entity });
    }
  }

  toggleSpeakerMute() {
    const entity = this.config?.speaker;
    if (!entity || !this.hass?.states?.[entity]) return;
    if (!this.speakerOn) return;
    const newMuted = !this.speakerMuted;
    this.speakerMuted = newMuted;
    this.hass.callService("media_player", "volume_mute", {
      entity_id: entity,
      is_volume_muted: newMuted
    });
  }

  /* ── SVG Icons ── */
  _iconPower() {
    return html`
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42A6.92 6.92 0 0 1 19 12c0 3.87-3.13 7-7 7A7 7 0 0 1 5 12c0-2.28 1.09-4.3 2.79-5.61L6.37 5.17A8.932 8.932 0 0 0 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.19-3.17-6.83z"/>
      </svg>`;
  }

  _iconPlay() {
    return html`
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 5v14l11-7z"/>
      </svg>`;
  }

  _iconPause() {
    return html`
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
      </svg>`;
  }

  _iconMicOff() {
    return html`
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
      </svg>`;
  }

  _iconMicOn() {
    return html`
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
      </svg>`;
  }

  render() {
    const speakerBg = this.config.speaker_bg || `${this.base}/images/container-images/background-alice.png`;
    const tvBg      = this.config.tv_bg      || `${this.base}/images/container-images/background-tv.png`;

    return html`
      <div class="wrapper">

        <!-- АЛИСА -->
        <div class="column"
            data-bg="${speakerBg}"
            @click=${() => this._fireMoreInfo(this.config?.speaker)}>

          <!-- Декоративное изображение Алисы -->
          <div class="alice-img">
            <img src="${this.base}/images/container-images/alice.png">
          </div>

          <!-- Заголовок -->
          <div class="title-wrapper">
            <div class="circle ${this.speakerOn ? 'on' : 'off'}"></div>
            <div class="title-text">Алиса</div>
          </div>

          <!-- Громкость + кнопки -->
          <div>
            <div class="volume-section" @click=${e => { e.stopPropagation(); this._fireMoreInfo(this.config?.speaker); }}>
              <div class="volume-label">Громкость</div>
              <div class="volume-value">${this.speakerVolume} %</div>
            </div>

            <div class="controls" style="margin-top:10px;">
              <!-- Микрофон (mute) -->
              <div class="control"
                  @pointerdown=${this._stopPropagation}
                  @click=${e => { e.stopPropagation(); this.toggleSpeakerMute(); }}>
                ${this.speakerMuted ? this._iconMicOff() : this._iconMicOn()}
              </div>

              <!-- Play / Pause -->
              <div class="control"
                  @pointerdown=${this._stopPropagation}
                  @click=${e => { e.stopPropagation(); this.toggleSpeakerPlay(); }}>
                ${this.speakerPlaying ? this._iconPause() : this._iconPlay()}
              </div>
            </div>
          </div>
        </div>

        <!-- ТВ -->
        <div class="column tv"
            data-bg="${tvBg}"
            @click=${() => this._fireMoreInfo(this.config?.tv)}>

          <!-- Заголовок -->
          <div class="title-wrapper">
            <div class="circle ${this.tvOn ? 'on' : 'off'}"></div>
            <div class="title-text">ТВ</div>
          </div>

          <!-- Громкость + кнопки -->
          <div>
            <div class="volume-section" @click=${e => { e.stopPropagation(); this._fireMoreInfo(this.config?.tv); }}>
              <div class="volume-label">Громкость</div>
              <div class="volume-value">${this.tvVolume} %</div>
            </div>

            <div class="controls" style="margin-top:10px;">
              <!-- Play / Pause -->
              <div class="control"
                  @pointerdown=${this._stopPropagation}
                  @click=${e => { e.stopPropagation(); this.toggleTvPlay(); }}>
                ${this.tvPlaying ? this._iconPause() : this._iconPlay()}
              </div>

              <!-- Питание -->
              <div class="control ${this.tvOn ? 'active' : ''}"
                  @pointerdown=${this._stopPropagation}
                  @click=${e => { e.stopPropagation(); this.toggleTv(); }}>
                ${this._iconPower()}
              </div>
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
    _config: { state: true },
    _tab: { state: true },
    // Speaker bg upload
    _speakerUploadState: { state: true },
    _speakerUploadError: { state: true },
    _speakerDragOver:    { state: true },
    // TV bg upload
    _tvUploadState: { state: true },
    _tvUploadError: { state: true },
    _tvDragOver:    { state: true },
  };

  static styles = css`
    :host { display: block; box-sizing: border-box; }

    .tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .tab {
      padding: 8px 12px; border-radius: 10px;
      border: 1px solid var(--divider-color);
      background: var(--secondary-background-color);
      cursor: pointer; font-size: 14px;
    }
    .tab.active { background: var(--primary-color); color: white; border-color: var(--primary-color); }

    .section-title {
      font-size: 13px; font-weight: 700;
      color: var(--secondary-text-color);
      text-transform: uppercase; letter-spacing: .05em;
      margin: 12px 0 8px;
    }

    .img-field { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
    .img-label { font-size: 13px; font-weight: 600; color: var(--primary-text-color); }

    .img-preview {
      width: 100%; height: 140px; border-radius: 16px; overflow: hidden;
      background: #1C1B1F; border: 1px solid rgba(101,101,101,0.3);
      display: flex; align-items: center; justify-content: center;
    }
    .img-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .img-preview-empty {
      font-size: 12px; color: var(--secondary-text-color);
      text-align: center; padding: 16px; line-height: 1.5;
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

    hr { border: none; border-top: 1px solid var(--divider-color); margin: 8px 0 16px; }

    input[type="file"] { display: none; }
  `;

  constructor() {
    super();
    this._tab = 0;
    this._speakerUploadState = "idle";
    this._speakerUploadError = "";
    this._speakerDragOver = false;
    this._tvUploadState = "idle";
    this._tvUploadError = "";
    this._tvDragOver = false;
  }

  setConfig(config) {
    this._config = { ...config };
  }

  render() {
    if (!this._config) return html``;
    return html`
      <div class="tabs">
        ${["Объект", "Внешний вид", "Взаимодействия"].map((t, i) => html`
          <div class="tab ${this._tab === i ? "active" : ""}" @click=${() => this._tab = i}>${t}</div>
        `)}
      </div>
      ${this._tab === 0 ? this._objectTab() : ""}
      ${this._tab === 1 ? this._appearanceTab() : ""}
      ${this._tab === 2 ? this._actionsTab() : ""}
    `;
  }

  _objectTab() {
    return this._form([
      { name: "tv",      required: true, label: "Телевизор",      selector: { entity: { domain: "media_player" } } },
      { name: "speaker", required: true, label: "Колонка / Алиса", selector: { entity: { domain: "media_player" } } },
      { name: "base_path", selector: { text: {} } }
    ]);
  }

  _appearanceTab() {
    return html`
      <div class="section-title">Фон колонки «Алиса»</div>
      ${this._renderBgUpload({
        src:       this._config?.speaker_bg,
        stateKey:  "_speakerUploadState",
        errorKey:  "_speakerUploadError",
        dragKey:   "_speakerDragOver",
        inputId:   "speakerFileInput",
        configKey: "speaker_bg",
      })}

      <hr>

      <div class="section-title">Фон колонки «ТВ»</div>
      ${this._renderBgUpload({
        src:       this._config?.tv_bg,
        stateKey:  "_tvUploadState",
        errorKey:  "_tvUploadError",
        dragKey:   "_tvDragOver",
        inputId:   "tvFileInput",
        configKey: "tv_bg",
      })}
    `;
  }

  _renderBgUpload({ src, stateKey, errorKey, dragKey, inputId, configKey }) {
    const uploadState = this[stateKey];
    const uploadError = this[errorKey];
    const dragOver    = this[dragKey];

    return html`
      <div class="img-field">
        <div class="img-preview">
          ${src ? html`
            <img src=${src} alt="preview"
              @error=${() => { this[stateKey] = "error"; this[errorKey] = "Файл не найден"; }}
            />
          ` : html`
            <div class="img-preview-empty">Фон не задан.<br>Будет использован фон по умолчанию.</div>
          `}
        </div>

        <div
          class="drop-zone ${dragOver ? "dragover" : ""} ${uploadState === "loading" ? "loading" : ""}"
          @dragover=${e => { e.preventDefault(); this[dragKey] = true; }}
          @dragleave=${() => this[dragKey] = false}
          @drop=${e => { e.preventDefault(); this[dragKey] = false; const f = e.dataTransfer?.files?.[0]; if (f) this._uploadFile(f, stateKey, errorKey, configKey); }}
          @click=${e => { e.stopPropagation(); this.shadowRoot?.getElementById(inputId)?.click(); }}
        >
          <div class="drop-icon">${uploadState === "loading" ? "⏳" : "🖼️"}</div>
          <div class="drop-text">${uploadState === "loading" ? "Загрузка..." : "Перетащите изображение сюда"}</div>
          <div class="drop-sub">PNG, JPG, WebP, AVIF, SVG</div>
          ${uploadState !== "loading" ? html`
            <button class="drop-btn" @click=${e => { e.stopPropagation(); this.shadowRoot?.getElementById(inputId)?.click(); }}>Выбрать файл</button>
          ` : ""}
        </div>

        <input type="file" id="${inputId}" accept="image/*"
          @change=${e => { const f = e.target?.files?.[0]; if (f) this._uploadFile(f, stateKey, errorKey, configKey); e.target.value = ""; }}
        />

        ${uploadState === "success" ? html`<div class="status-row success">✓ Изображение загружено</div>` : ""}
        ${uploadState === "error"   ? html`<div class="status-row error">⚠ ${uploadError}</div>` : ""}

        ${src ? html`
          <div class="current-path">
            <span title=${src}>${src}</span>
            <button class="path-clear" @click=${() => this._clearImage(stateKey, errorKey, configKey)}>✕</button>
          </div>
        ` : ""}
      </div>
    `;
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

  /* ── Нормализация MIME для HA API ── */
  _normalizeFileForUpload(file) {
    const unsupportedByHA = ["image/avif", "image/jxl", "image/heic", "image/heif"];
    if (unsupportedByHA.includes(file.type)) {
      return new File([file], file.name, { type: "image/png" });
    }
    return file;
  }

  async _uploadFile(file, stateKey, errorKey, configKey) {
    if (!file.type.startsWith("image/")) {
      this[stateKey] = "error";
      this[errorKey] = "Файл не является изображением";
      return;
    }

    this[stateKey] = "loading";
    this[errorKey] = "";

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
        this._setImage(configKey, json.url || `/local/${file.name}`);
        this[stateKey] = "success";
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
        this._setImage(configKey, `/api/image/serve/${json.id}/original`);
        this[stateKey] = "success";
        return;
      }

      throw new Error(`HTTP ${resp.status}`);
    } catch (err) {
      this[stateKey] = "error";
      this[errorKey] = `Не удалось загрузить файл (${err.message}).`;
    }
  }

  _setImage(configKey, path) {
    this._config = { ...this._config, [configKey]: path };
    this._fire();
  }

  _clearImage(stateKey, errorKey, configKey) {
    this[stateKey] = "idle";
    this[errorKey] = "";
    const config = { ...this._config };
    delete config[configKey];
    this._config = config;
    this._fire();
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

/* Регистрация */

EmelyaMediaColumns.getConfigElement = function () {
  return document.createElement("emelya-media-columns-editor");
};

EmelyaMediaColumns.getStubConfig = function () {
  return {
    tv: "",
    speaker: "",
    base_path: "/local"
  };
};

customElements.define("emelya-media-columns-editor", EmelyaMediaColumnsEditor);
customElements.define("emelya-media-columns", EmelyaMediaColumns);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom:emelya-media-columns",
  name: "Emelya Media Columns",
  description: "Колонки ТВ + Алиса",
  preview: true
});