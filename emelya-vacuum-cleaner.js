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
    this._lastUserChange = 0;
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

    const now = Date.now();
    const ignore = (now - this._lastUserChange) < 800;

    // CLEANING 
    const newCleaning = stateObj.state === "cleaning";

    if(this._expectedCleaning !== null){
      if(newCleaning !== this._expectedCleaning) return;
      this._expectedCleaning = null;
    }

    this.cleaning = newCleaning;

    // BATTERY 
    const battery = stateObj.attributes?.battery_level;
    if(battery !== undefined){
      this.battery = battery;
    }

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

      if(!ignore){
        this.selectedMode = newMode;
      }
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

    .select{
      position:relative;
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding:8px 14px;
      height:36px;
      border:1px solid white;
      border-radius:12px;
      cursor:pointer;
      user-select:none;
      font-size:14px;
    }

    .arrow{
      width:12px;
      height:12px;
      border-right:2px solid white;
      border-bottom:2px solid white;
      transform:rotate(45deg);
      transition:0.2s;
    }

    .arrow.open{
      transform:rotate(-135deg);
    }

    .dropdown{
      position:absolute;
      top:42px;
      left:0;
      right:0;
      background:#1C1B1F;
      border:1px solid white;
      border-radius:12px;
      overflow:hidden;
      z-index:10;
    }

    .option{
      padding:8px 14px;
      cursor:pointer;
      font-size:14px;
    }

    .option:hover{
      background: #343239;
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
      background:#ff7a2f;
    }

  `;

  _toggleSelect(){
    this.open = !this.open;
  }

  _selectMode(mode){
    this.selectedMode = mode;
    this.open = false;

    const entity = this.config?.entity;

    const modeMap = {
      "Ежедневная уборка": "standard",
      "Тщательная уборка": "turbo",
      "Быстрая уборка": "quiet"
    };

    const fan = modeMap[mode];

    if(this.hass?.states?.[entity]){
      this._expectedFan = mode;

      this.hass.callService("vacuum","set_fan_speed",{
        entity_id: entity,
        fan_speed: fan
      });
    }
  }

  _toggleCleaning(){

    const entity = this.config?.entity;

    const newState = !this.cleaning;
    this.cleaning = newState;

    if(this.hass?.states?.[entity]){

      this._expectedCleaning = newState;

      const service = newState ? "start" : "stop";

      this.hass.callService("vacuum",service,{
        entity_id: entity
      });
    }
  }

  render(){
    const bg = `${this.base}/images/container-images/vacuum-cleaner.png`;
    const stateObj = this.hass?.states?.[this.config?.entity];
    const fanList = stateObj?.attributes?.fan_speed_list || this.initialFanList;

    const modeNames = {
      standard: "Ежедневная уборка",
      turbo: "Тщательная уборка",
      quiet: "Быстрая уборка"
    };

    const modes = fanList.map(f => modeNames[f] || f);
    return html`

      <div class="frame" style="
        background:
          url('${bg}') center/cover no-repeat,
          #1C1B1F;
      ">

        <div class="type">
          <div class="title">Робот пылесос</div>
          <div class="subtitle">${this.battery}% заряда</div>
        </div>

        <div class="controls">

          <div class="select" @click=${this._toggleSelect}>

            <div>${this.selectedMode}</div>

            <div class="arrow ${this.open ? "open" : ""}"></div>

            ${this.open ? html`

              <div class="dropdown">

                ${modes.map(mode => html`

                  <div
                    class="option"
                    @click=${(e)=>{
                      e.stopPropagation();
                      this._selectMode(mode);
                    }}
                  >
                    ${mode}
                  </div>

                `)}

              </div>

            ` : ""}

          </div>

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

    `;
  }

}

customElements.define("emelya-vacuum-cleaner", EmelyaVacuumCleaner);