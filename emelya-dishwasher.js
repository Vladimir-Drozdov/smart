import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";

class EmelyaDishwasherCard extends LitElement {

  static properties = {
    hass: {},
    config: {},
    open: { state: true },
    selectedMode: {},
    power: { type:Boolean },
    modes: { state: true }
  };

  constructor(){
    super();
    this.open = false;
    this.selectedMode = "Деликатный";
    this.power = false;
    this._expectedPower = null;
    this._expectedMode = null;
    this.modes = [
      "Деликатный",
      "Быстрый",
      "Интенсивный"
    ];
  }

  setConfig(config) {
    this.config = config;
    this.base = config.base_path || "/local";
  }
  set hass(hass){
    this._hass = hass;

    const entity = this.config?.entity;
    const stateObj = hass.states?.[entity];

    if(stateObj){
      const newPower = stateObj.state === "on";

      if(this._expectedPower !== null){
        if(newPower === this._expectedPower){
          this._expectedPower = null;
          this.power = newPower;
        }
      } else {
        this.power = newPower;
      }
    }

    const modeEntity = this.config?.mode_entity;
    const modeState = hass.states?.[modeEntity];

    if(modeState){
      const newMode = modeState.state;
      const options = modeState.attributes?.options || [];
      this.modes = options;

      if(this._expectedMode !== null){
        if(newMode === this._expectedMode){
          this._expectedMode = null;
          this.selectedMode = newMode;
        }
      } else {
        this.selectedMode = newMode;
      }
    }
  }

  get hass(){
    return this._hass;
  }

  static styles = css`
    :host {
      display:block;
      max-width:320px;
      width:100%;
    }

    .card{
      box-sizing:border-box;
      display:flex;
      flex-direction:column;
      justify-content:space-between;

      padding:16px;
      height:320px;
      border-radius:24px;
      color:white;
    }

    .header{
      display:flex;
      justify-content:space-between;
      align-items:center;
    }

    .title{
      font-size:16px;
      font-weight:600;
    }

    .state{
      font-size:15px;
      opacity:0.6;
    }

    .controls{
      display:flex;
      gap:8px;
      height:56px;
    }

    .select{
      position:relative;

      flex:1;

      display:flex;
      align-items:center;
      justify-content:space-between;

      padding:0 20px;

      background:rgba(255,255,255,0.1);

      border-radius:16px;

      font-size:15px;
      cursor:pointer;
      user-select:none;

      transition:0.2s;
    }

    .select.disabled{
      opacity:0.4;
      cursor:default;
    }

    .select.active{
      background:#343239;
    }

    .arrow{
      width:8px;
      height:8px;

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
      top:60px;
      left:0;
      right:0;
      background:#1C1B1F;
      border-radius:16px;
      overflow:hidden;
      z-index:10;
    }

    .option{
      padding:12px 16px;
      cursor:pointer;
      font-size:15px;
    }

    .option:hover{
      background:#343239;
    }

    .option.selected{
      background:#343239;
      font-weight:600;
    }

    .power{
      width:80px;

      display:flex;
      justify-content:center;
      align-items:center;

      border-radius:16px;

      background:rgba(255,255,255,0.1);

      cursor:pointer;

      transition:0.2s;
    }

    .power.active{
      background:#E65332;
    }

    .power img{
      width:28px;
      height:28px;
    }

  `;

  _togglePower(){
    const entity = this.config?.entity;
    const newPower = !this.power;

    this.power = newPower;
    this._expectedPower = newPower; 

    this.open = false;
    if(!this.hass || !entity) return;
    this.hass.callService("switch","toggle",{
      entity_id: entity
    });
  }

  _toggleSelect(){

    if(!this.power) return;

    this.open = !this.open;
  }

  _selectMode(e,mode){
    e.stopPropagation();
    this.selectedMode = mode;
    this._expectedMode = mode;

    this.open = false;
    if(!this.power) return;

    const entity = this.config?.mode_entity;
    if(!this.hass || !entity) return;
    this.hass.callService("select","select_option",{
      entity_id: entity,
      option: mode
    });
  }

  render(){
    const bg = `${this.base}/images/container-images/dishwasher.png`;
    const modes = this.modes || [];
    

    return html`

      <div
        class="card"
        style="
          background:
            linear-gradient(180deg, rgba(28,27,31,0) 75%, #1C1B1F 100%),
            url('${bg}') center/cover no-repeat,
            #1C1B1F;
        "
      >

        <div class="header">
          <div class="title">Посудомойка</div>
          <div class="state">
            ${this.power ? "Включено" : "Выключено"}
          </div>
        </div>

        <div class="controls">

          <div
            class="select ${this.power ? 'active' : 'disabled'}"
            @click=${this._toggleSelect}
          >

            <div>${this.selectedMode}</div>

            <div class="arrow ${this.open ? "open" : ""}"></div>

            ${this.open ? html`

              <div class="dropdown">

                ${modes.length === 0
                  ? html`<div class="option disabled">Нет режимов</div>`
                  : modes.map(mode => html`
                      <div
                        class="option ${this.selectedMode === mode ? "selected" : ""}"
                        @click=${(e)=>this._selectMode(e,mode)}
                      >
                        ${mode}
                      </div>
                    `)
                }

              </div>

            ` : ""}

          </div>

          <div
            class="power ${this.power ? "active" : ""}"
            @click=${this._togglePower}
          >
            <img src="${this.base}/images/container-images/power_button.png">
          </div>

        </div>

      </div>

    `;
  }

}

customElements.define("emelya-dishwasher", EmelyaDishwasherCard);