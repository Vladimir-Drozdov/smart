// type: custom:emelya-media-columns
import { LitElement, html, css } from "https://unpkg.com/lit?module";

class EmelyaMediaColumns extends LitElement {
  static properties = {
    hass: {},
    showCircle: { type: Boolean },
    config: {},
    speakerOn: { state: true },
    tvOn: { state: true },
    volume: { state: true }
  };

  constructor() {
    super();

    // ТВ
    this.tvOn = false;

    // Алиса
    this.speakerOn = false;
    this.volume = 70;

    this.showCircle = false;
    this._expectedTv = null;
    this._expectedSpeaker = null;
    this._expectedVolume = null;
    this._holdInterval = null;
    this._holdTimeout = null;
    this._commitTimer = null;
    this._draggingVolume = false;
    this._lastUserChange = 0;
  }

  setConfig(config) {
    this.base = config.base_path || "/local";
    this.config = {
      tv: config.tv,
      speaker: config.speaker,
      ...config
    };

  }
  set hass(hass){
    this._hass = hass;

    //  ТВ 
    const tvEntity = this.config?.tv;

    if(tvEntity){
      const tvState = hass.states?.[tvEntity];

      if(tvState){
        const newTv = tvState.state === "on";

        if(this._expectedTv !== null){
          if(newTv !== this._expectedTv) return;
          this._expectedTv = null;
        }

        this.tvOn = newTv;
        this.showCircle = newTv;
      }
    }

    //  КОЛОНКА 
    const speakerEntity = this.config?.speaker;

    if(speakerEntity){
      const speakerState = hass.states?.[speakerEntity];

      if(speakerState){

        const newSpeaker = speakerState.state === "on";

        if(this._expectedSpeaker !== null){
          if(newSpeaker !== this._expectedSpeaker) return;
          this._expectedSpeaker = null;
        }

        this.speakerOn = newSpeaker;

        const volume = speakerState.attributes?.volume_level;

        if(volume !== undefined){

          const percent = Math.round(volume * 100);

          if(this._expectedVolume !== null){

            if(Math.abs(percent - this._expectedVolume) > 1) return;

            this._expectedVolume = null;

          } else if(!this._draggingVolume){

            this.volume = percent;

          }

        }
      }
    }
  }

  get hass(){
    return this._hass;
  }

  static styles = css`
    :host {
      display: block;
      max-width:320px;
      width:100%;
    }

    .wrapper {
      display: flex;
      flex-direction: row;
      gap: 8px;
    }

    .column {
      width: 50%;
      height: 280px;
      border-radius: 24px;
      padding: 16px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background-size: cover;
      background-position: center;
      background-repeat:no-repeat;
      color: white;
    }

    .controls {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .control {
      background: rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      cursor: pointer;
    }
    .control {
      transition: background 0.2s ease;
    }
    .control.active {
      background: #ff7a2f;
    }

    .title-wrapper {
      display: inline-flex;
      align-items: center;
      width:50%;
      gap: 8px;
      padding: 6px 6px 6px 12px;
      background: #1C1B1F;
      border-radius: 100px;
    }

    .title {
      font-size: 20px;
      font-weight: 500;
      color: white;
    }

    .circle {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #7FB800;
      opacity: 0;
      visibility:hidden;
      transition: opacity 0.2s;
    }

    .circle.visible {
      opacity: 1;
      visibility:visible;
    }

    .alice{
      top:-3%;
      right:-8%;
      position:absolute;
      width:100%;
      height:50%;
    }

    .alice img{
      width: 100%; 
      height: 100%;
      object-fit: contain;
    }
    .box{
      height:56px;
      width: 100%;
      background: rgba(0,0,0,0.4);
      border-radius:16px;
      display:flex;
      justify-content:center;
      align-items:center;
      gap:3px;
    }

    .value{
      min-width:60px;
      font-size:40px;
      text-align:center;
      font-weight:600;
    }

    .arrow{
      width:16px;
      height:16px;
      display:flex;
      justify-content:center;
      align-items:center;
      cursor:pointer;
    }

    .arrow::before{
      content:"";
      border-left:6px solid transparent;
      border-right:6px solid transparent;
    }

    .arrow.up::before{
      border-bottom:8px solid white;
    }

    .arrow.down::before{
      border-top:8px solid white;
    }
  `;
  toggleTv(){
    const newState = !this.tvOn;
    this.tvOn = newState;
    this.showCircle = newState;

    const entity = this.config?.tv;

    if(this.hass?.states?.[entity]){
      this._expectedTv = newState;

      this.hass.callService("media_player","toggle",{
        entity_id: entity
      });
    }
  }
  openYoutube(){

    const entity = this.config?.tv;

    if(!entity || !this.hass?.states?.[entity]) return;

    this.hass.callService("media_player","play_media",{
      entity_id: entity,
      media_content_type: "app",
      media_content_id: "youtube"
    });

  }
  openKinopoisk(){

    const entity = this.config?.tv;

    if(!entity || !this.hass?.states?.[entity]) return;

    this.hass.callService("media_player","play_media",{
      entity_id: entity,
      media_content_type: "app",
      media_content_id: "kinopoisk"
    });

  }
  toggleSpeaker(){
    const newState = !this.speakerOn;
    this.speakerOn = newState;

    const entity = this.config?.speaker;

    if(this.hass?.states?.[entity]){
      this._expectedSpeaker = newState;

      const service = newState ? "turn_on" : "turn_off";

      this.hass.callService("media_player",service,{
        entity_id: entity
      });
    } 
  }
  
  _startHoldVolume(delta){
    window.addEventListener("mouseup", this._stopHoldVolume);

    this._draggingVolume = true;

    this._holdTimeout = setTimeout(()=>{
      this._holdInterval = setInterval(()=>{
        this._changeVolume(delta);
      },40);
    },300);
  }
  _stopHoldVolume = () => {
    if(!this._holdInterval && !this._holdTimeout) return;

    window.removeEventListener("mouseup", this._stopHoldVolume);

    clearTimeout(this._holdTimeout);
    clearInterval(this._holdInterval);

    this._holdTimeout = null;
    this._holdInterval = null;

    this._commitVolume();

    this._draggingVolume = false;
  };
  _changeVolume(delta){
    if(!this.speakerOn) return;

    let newVol = this.volume + delta;

    if(newVol > 100) newVol = 100;
    if(newVol < 0) newVol = 0;

    this.volume = newVol;
  }
  _commitVolume(){
    clearTimeout(this._commitTimer);

    this._commitTimer = setTimeout(()=>{
      const entity = this.config?.speaker;
      if(!this.hass || !entity) return;

      const stateObj = this.hass.states?.[entity];
      if(!stateObj) return;

      if(stateObj.state === "unavailable" || stateObj.state === "unknown"){
        return;
      }

      this._expectedVolume = this.volume;

      this.hass.callService("media_player","volume_set",{
        entity_id: entity,
        volume_level: this.volume / 100
      });
    },150);
  }

  render() {
    return html`
      <div class="wrapper">
        <div class="column"
            style='background-image: linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 100%), url("${this.base}/images/container-images/background-tv.png");'>

          <div class="title-wrapper">
              <div class="circle ${this.showCircle ? 'visible' : ''}"></div>
              <div class="title">ТВ</div>
          </div>

          <div class="controls">
            <div class="control" @click=${this.openKinopoisk}>
              <img src="${this.base}/images/container-images/kinopoisk.png">
            </div>

            <div class="control" @click=${this.openYoutube} >
              <img src="${this.base}/images/container-images/youtube.png">
            </div>

            <div 
              class="control ${this.tvOn ? "active" : ""}" 
              @click=${this.toggleTv}
            >
              <img src="${this.base}/images/container-images/power_button.png">
            </div>
          </div>

        </div>

        <!-- Алиса колонка -->
        <div class="column"
            style='background-image: linear-gradient(180deg, #000 0%, rgba(0,0,0,0.4) 40%, #000 100%), url("${this.base}/images/container-images/background-alice.png"); position:relative; overflow:hidden;'>

            <div class="alice">
                <img src="${this.base}/images/container-images/alice.png">
            </div>

            <div class="title" style="text-align:start; position:relative; z-index:2;">
              Колонка Алиса
            </div>

            <div>
              <div>
                  <div style="font-size:12px;font-weight:700;width:100%; text-align:end; position:relative; z-index:2;">
                    Громкость
                  </div>

                  <div style="width:100%; position:relative; z-index:2;">
                    <div class="box temp" style="z-index:2; position:relative;">

                      <div
                        class="arrow up"
                        @click=${()=>{
                          this._changeVolume(1);
                          this._commitVolume();
                        }}
                        @mousedown=${()=>this._startHoldVolume(1)}
                        @mouseup=${this._stopHoldVolume}
                        @mouseleave=${this._stopHoldVolume}
                      ></div>

                      <div class="value">
                        ${this.volume}%
                      </div>

                      <div
                        class="arrow down"
                        @click=${()=>{
                          this._changeVolume(-1);
                          this._commitVolume();
                        }}
                        @mousedown=${()=>this._startHoldVolume(-1)}
                        @mouseup=${this._stopHoldVolume}
                        @mouseleave=${this._stopHoldVolume}
                      ></div>

                    </div>
                  </div>
              </div>

              <div 
                class="control ${this.speakerOn ? "active" : ""}" 
                @click=${this.toggleSpeaker}
              >
                  <img src="${this.base}/images/container-images/power_button.png">
              </div>
            </div>
        </div>

      </div>
    `;
  }
}

customElements.define("emelya-media-columns", EmelyaMediaColumns);