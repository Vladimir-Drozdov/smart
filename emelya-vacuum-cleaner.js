import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";

class EmelyaVacuumCleaner extends LitElement {

  static properties = {
    hass: {},
    config: {},
    selectedMode: { state:true },
    open: { state:true },
    cleaning: { state:true },
    battery: { state:true }
  };

  constructor(){
    super();
    this.selectedMode = "Ежедневная уборка";
    this.open = false;
    this.cleaning = false;
    this.battery=0;
    this._expectedCleaning = null;
    this._expectedFan = null;
    this.initialFanList=["standard", "turbo", "quiet"]
  }

  setConfig(config){
    this.config = config || {};
    this.base = config.base_path || "/local";
  }

  set hass(hass){
    this._hass = hass;

    const entity = this.config?.entity;
    const stateObj = hass.states?.[entity];

    if(!stateObj) return;

    // CLEANING 
    const newCleaning = stateObj.state === "cleaning";

    if(this._expectedCleaning !== null){
      if(newCleaning !== this._expectedCleaning) return;
      this._expectedCleaning = null;
    }

    this.cleaning = newCleaning;

    // BATTERY 
    const battery = stateObj.attributes?.battery_level;
    this.battery = battery !== undefined ? battery : null;

    // FAN MODE 
    const fan = stateObj.attributes?.fan_speed;

    const reverseModeMap = {
      standard: "Ежедневная уборка",
      turbo: "Тщательная уборка",
      quiet: "Быстрая уборка"
    };

    if(fan){

      const newMode = reverseModeMap[fan] || fan;

      if(this._expectedFan !== null){
        if(newMode !== this._expectedFan) return;
        this._expectedFan = null;
      }
      this.selectedMode = newMode;

    }
  }

  get hass(){
    return this._hass;
  }

  static styles = css`

    :host{
      display:block;
      width:100%;
      max-width:320px;
      font-family:Roboto;
    }

    .frame{
      box-sizing:border-box;
      display:flex;
      flex-direction:column;
      justify-content:space-between;
      padding:16px;
      gap:24px;
      height:368px;
      background-size:cover;
      background-position:center;
      background-blend-mode:luminosity, normal;

      border-radius:24px;
      color:white;
    }

    .type{
      display:flex;
      flex-direction:column;
      gap:4px;
    }

    .title{
      font-weight:600;
      font-size:16px;
    }

    .subtitle{
      font-size:15px;
      opacity:0.8;
    }

    .controls{
      display:flex;
      flex-direction:column;
      gap:8px;
    }
    ha-select {
      width: 100%;
    }

    .start{
      display:flex;
      justify-content:center;
      align-items:center;
      padding:8px 14px;
      height:36px;
      background:#343239;
      border-radius:12px;
      font-weight:600;
      font-size:14px;
      cursor:pointer;
      transition:0.2s;
    }

    .start.active{
      background:#E65332;
    }

  `;

  _toggleCleaning(e){
    e.stopPropagation();
    const entity = this.config?.entity;

    if(!this.hass?.states?.[entity]) return;

    const service = this.cleaning ? "stop" : "start";
    this._expectedCleaning = service === "start" ? true : false;

    this.hass.callService("vacuum", service, {
      entity_id: entity
    });
  }
  _fireMoreInfo(entityId){
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId },
      bubbles: true,
      composed: true
    }));
  }

  _handleCardClick(e){
    if(e.target.closest("ha-select")) return;

    const entity = this.config?.entity;
    if(!entity) return;

    this._fireMoreInfo(entity);
  }

  render(){
    const bg = `${this.base}/images/container-images/vacuum-cleaner.png`;
    const stateObj = this.hass?.states?.[this.config?.entity];
    const fanList = stateObj?.attributes?.fan_speed_list || this.initialFanList;

    return html`
      <ha-card>
        <div class="frame" @click=${this._handleCardClick} style="
          background:
            url('${bg}') center/cover no-repeat,
            #1C1B1F;
        ">

          <div class="type">
            <div class="title">Робот пылесос</div>
            <div class="subtitle">
              ${this.battery !== null ? `${this.battery}% заряда` : ""}
            </div>
          </div>

          <div class="controls">

            ${stateObj ? html`
              <ha-select
                .label=${"Режим уборки"}
                .value=${this.selectedMode}
                @change=${(e)=>{
                  e.stopPropagation();
                  const mode = e.target.value;
                  this.selectedMode = mode;
                  this._expectedFan = mode;

                  const entity = this.config?.entity;
                  const modeMap = {
                    "Ежедневная уборка": "standard",
                    "Тщательная уборка": "turbo",
                    "Быстрая уборка": "quiet"
                  };
                  const fan = modeMap[mode] || mode;;
                  if(this.hass?.states?.[entity]){
                    this.hass.callService("vacuum","set_fan_speed",{
                      entity_id: entity,
                      fan_speed: fan
                    });
                  }
                }}
              >
                ${fanList.map(f => {
                  const modeName = {
                    standard: "Ежедневная уборка",
                    turbo: "Тщательная уборка",
                    quiet: "Быстрая уборка"
                  }[f] || f;
                  return html`<mwc-list-item .value=${modeName}>${modeName}</mwc-list-item>`;
                })}
              </ha-select>
            ` : ""}

            <div
              class="start ${this.cleaning ? "active" : ""}"
              @click=${this._toggleCleaning}
            >
              ${this.cleaning
                ? "Остановить уборку"
                : "Начать уборку в гостиной"}
            </div>
          </div>
        </div>
      </ha-card>
    `;
  }

}

customElements.define("emelya-vacuum-cleaner", EmelyaVacuumCleaner);
/*
- type: custom:emelya-vacuum-cleaner
  base_path: /local
  entity: vacuum.robot
*/