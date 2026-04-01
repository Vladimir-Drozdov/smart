// type: custom:emelya-media-columns
import { LitElement, html, css } from "https://unpkg.com/lit?module";

class EmelyaMediaColumns extends LitElement {
  static properties = {
    hass: {},
    showCircle: { type: Boolean },
    config: {},
    speakerOn: { state: true },
    tvOn: { state: true },
    volume: { state: true },
  };

  constructor() {
    super();
    this.tvOn = false;
    this.speakerOn = false;
    this.volume = 70;
    this.showCircle = false;
    this._expectedTv = null;
    this._expectedSpeaker = null;
  }

  setConfig(config) {
    this.base = config.base_path || "/local";
    this.config = { tv: config.tv, speaker: config.speaker, ...config };
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
          if (newTv !== this._expectedTv) return;
          this._expectedTv = null;
        }
        this.tvOn = newTv;
        this.showCircle = newTv;
      }
    }

    // Колонка
    const speakerEntity = this.config?.speaker;
    if (speakerEntity) {
      const speakerState = hass.states?.[speakerEntity];
      if (speakerState) {
        const newSpeaker = speakerState.state !== "off";
        if (this._expectedSpeaker !== null) {
          if (newSpeaker !== this._expectedSpeaker) return;
          this._expectedSpeaker = null;
        }
        this.speakerOn = newSpeaker;
        const volume = speakerState.attributes?.volume_level;
        if (volume !== undefined) this.volume = Math.round(volume * 100);
      }
    }
  }

  get hass() {
    return this._hass;
  }

  static styles = css`
    :host { display: block; max-width:320px; width:100%; }
    .wrapper { display:flex; gap:8px; }
    .column {
      width:50%; height:280px; border-radius:24px; padding:16px; box-sizing:border-box;
      display:flex; flex-direction:column; justify-content:space-between;
      background-size:cover; background-position:center; background-repeat:no-repeat; color:white;
      cursor: pointer;
    }
    .controls { display:flex; flex-direction:column; gap:8px; }
    .control {
      background: rgba(255,255,255,0.1); border-radius:16px; padding:16px 20px;
      display:flex; align-items:center; justify-content:center; gap:16px; cursor:pointer;
      transition: background 0.2s ease;
    }
    .control.active { background: #E65332; }
    .title-wrapper {
      display:inline-flex; align-items:center; width:50%; gap:8px; padding:6px 6px 6px 12px;
      background:#1C1B1F; border-radius:100px;
    }
    .title { font-size:20px; font-weight:500; color:white; }
    .circle { width:12px; height:12px; border-radius:50%; background:#7FB800; opacity:0; visibility:hidden; transition:opacity 0.2s; }
    .circle.visible { opacity:1; visibility:visible; }
    .alice { top:-3%; right:-8%; position:absolute; width:100%; height:50%; }
    .alice img { width:100%; height:100%; object-fit:contain; }
    .box { height:56px; width:100%; background:transparent; border-radius:16px;
      display:flex; justify-content:center; align-items:center; gap:3px; padding-bottom:5px;
    }
    .value { width:100%; font-size:60px; text-align:center; font-weight:600; }
  `;

  // Сервисы
  toggleTv() {
    const newState = !this.tvOn;
    this.tvOn = newState;
    this.showCircle = newState;
    const entity = this.config?.tv;
    if (this.hass?.states?.[entity]) {
      this._expectedTv = newState;
      this.hass.callService("media_player","toggle",{ entity_id: entity });
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
    this.hass.callService("media_player","play_media",{
      entity_id: entity,
      media_content_type: "app",
      media_content_id: "youtube"
    });
  }

  openKinopoisk() {
    const entity = this.config?.tv;
    if (!entity || !this.hass?.states?.[entity]) return;
    this.hass.callService("media_player","play_media",{
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
            style='background-image: linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 100%), url("${this.base}/images/container-images/background-tv.png");'
            @click=${() => this._fireMoreInfo(this.config?.tv)}>

          <div class="title-wrapper">
              <div class="circle ${this.showCircle ? 'visible' : ''}"></div>
              <div class="title">ТВ</div>
          </div>

          <div class="controls">
            <div class="control" @click=${e => { e.stopPropagation(); this.openKinopoisk(); }}>
              <img src="${this.base}/images/container-images/kinopoisk.png">
            </div>

            <div class="control" @click=${e => { e.stopPropagation(); this.openYoutube(); }}>
              <img src="${this.base}/images/container-images/youtube.png">
            </div>

            <div class="control ${this.tvOn ? "active" : ""}" @click=${e => { e.stopPropagation(); this.toggleTv(); }}>
              <img src="${this.base}/images/container-images/power_button.png">
            </div>
          </div>
        </div>

        <!-- Алиса колонка -->
        <div class="column"
            style='background-image: linear-gradient(180deg, #000 0%, rgba(0,0,0,0.4) 40%, #000 100%), url("${this.base}/images/container-images/background-alice.png"); position:relative; overflow:hidden;'
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

            <div class="control ${this.speakerOn ? "active" : ""}" @click=${e=>{ e.stopPropagation(); this.toggleSpeaker(); }}>
              <img src="${this.base}/images/container-images/power_button.png">
            </div>
          </div>
        </div>

      </div>
    `;
  }
}

customElements.define("emelya-media-columns", EmelyaMediaColumns);