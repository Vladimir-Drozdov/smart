import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";

class EmelyaBreezerCard extends LitElement {

  static properties = {
    hass: {},
    config: {},
    open: { state: true },
    selectedMode: {},
    power: { type: Boolean },
    modes: { state: true }
  };

  constructor(){
    super();

    this.open = false;

    this.selectedMode = "Комфорт";
    this.power = false;

    this.modes = [
      "Комфорт",
      "Эко",
      "Турбо",
      "Ночной"
    ];

    this._expectedPower = null;
    this._expectedMode = null;
  }

  set hass(hass){
    this._hass = hass;

    const entity = this.config?.entity;
    const stateObj = hass.states?.[entity];

    // POWER
    if(stateObj){
      const newPower = stateObj.state === "on";

      if(this._expectedPower !== null){
        if(newPower !== this._expectedPower){
          return;
        }
        this._expectedPower = null;
      }

      this.power = newPower;
    }

    // MODE
    const modeEntity = this.config?.mode_entity;
    const modeState = hass.states?.[modeEntity];

    if(modeState){
      const option = modeState.state;
      const options = modeState.attributes?.options;

      if(this._expectedMode !== null){
        if(option !== this._expectedMode){
          return;
        }
        this._expectedMode = null;
      }

      if(option){
        this.selectedMode = option;
      }

      if(options){
        this.modes = options;
      }
    }
  }

  get hass(){
    return this._hass;
  }

  setConfig(config){
    this.config = config || {};
    this.base = config.base_path || "/local";

    if(!config.entity){
      console.warn("emelya-breezer-card: entity not specified");
    }
  }

  static styles = css`

    :host{
      display:block;
      max-width:321px;
      width:100%;
    }

    .card{
      box-sizing:border-box;
      display:flex;
      flex-direction:column;
      gap:24px;

      padding:16px;
      height:132px;

      background:#1C1B1F;
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
      opacity:0.5;
    }

    .controls{
      display:flex;
      gap:8px;
      align-items:center;
    }

    .select{
      position:relative;

      display:flex;
      align-items:center;
      justify-content:space-between;

      width:201px;
      height:56px;

      padding:0 16px;

      background:#1C1B1F;
      border-radius:16px;

      font-weight:600;
      font-size:16px;

      cursor:pointer;
    }

    .arrow{
      width:10px;
      height:10px;

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
      height:56px;

      background:#1C1B1F;
      border-radius:16px;

      display:flex;
      justify-content:center;
      align-items:center;

      cursor:pointer;
      transition:0.2s;
    }

    .power.active{
      background:#e65332;
    }

    .power img{
      width:24px;
      height:24px;
    }

  `;

  _toggle(){
    this.power = !this.power;

    const entity = this.config?.entity;
    if(!this.hass?.states?.[entity]) return;

    this._expectedPower = this.power;

    const domain = entity.split(".")[0];
    const service = this.power ? "turn_on" : "turn_off";

    this.hass.callService(domain, service, {
      entity_id: entity
    });
  }

  _toggleSelect(){
    this.open = !this.open;
  }

  _selectMode(e, mode){
    e.stopPropagation();

    this.selectedMode = mode;
    this._expectedMode = mode;
    this.open = false;

    const modeEntity = this.config?.mode_entity;
    if(!this.hass?.states?.[modeEntity]) return;

    this.hass.callService("select", "select_option", {
      entity_id: modeEntity,
      option: mode
    });
  }

  render(){
    return html`

      <div class="card">

        <div class="header">
          <div class="title">Бризер</div>
          <div class="state">
            ${this.power ? "Работает" : "Выключено"}
          </div>
        </div>

        <div class="controls">

          <div class="select" @click=${this._toggleSelect}>
            <div>${this.selectedMode}</div>
            <div class="arrow ${this.open ? "open" : ""}"></div>

            ${this.open ? html`
              <div class="dropdown">
                ${this.modes.map(mode => html`
                  <div
                    class="option ${this.selectedMode===mode ? "selected":""}"
                    @click=${(e)=>this._selectMode(e,mode)}
                  >
                    ${mode}
                  </div>
                `)}
              </div>
            ` : ""}
          </div>

          <div class="power ${this.power ? "active":""}" @click=${this._toggle}>
            <img src="${this.base}/images/container-images/power_button.png">
          </div>

        </div>

      </div>
    `;
  }
}

customElements.define("emelya-breezer-card", EmelyaBreezerCard);

/*
type: custom:emelya-breezer-card
base_path: /local/emelya-cards-test
entity: switch.breezer
mode_entity: select.breezer_mode
*/