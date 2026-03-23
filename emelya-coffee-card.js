import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";

class EmelyaCoffeeCard extends LitElement {

  static properties = {
    hass: {},
    config: {},
    open: { state:true },
    selectedCoffee: {},
    power: { type:Boolean },
    coffeeTypes: { state:true }
  };

  constructor(){
    super();

    this.open = false;

    this.selectedCoffee = "Капучино";
    this.power = false;

    this.coffeeTypes = [
      "Капучино",
      "Латте",
      "Эспрессо",
      "Американо"
    ];

    this._expectedPower = null;
    this._expectedCoffee = null;
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

    // COFFEE
    const coffeeEntity = this.config?.coffee_entity;
    const coffeeState = hass.states?.[coffeeEntity];

    if(coffeeState){
      const option = coffeeState.state;
      const options = coffeeState.attributes?.options;

      if(this._expectedCoffee !== null){
        if(option !== this._expectedCoffee){
          return;
        }
        this._expectedCoffee = null;
      }

      if(option){
        this.selectedCoffee = option;
      }

      if(options){
        this.coffeeTypes = options;
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
      console.warn("emelya-coffee-card: entity not specified");
    }
  }

  static styles = css`

    :host{
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
      height:132px;

      background: #1C1B1F;
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
      align-items:center;
    }

    .select{
      position:relative;

      display:flex;
      align-items:center;
      justify-content:space-between;

      width:200px;
      height:56px;

      padding:0 16px;

      background:#1C1B1F;

      border:2px solid #656565;
      border-radius:16px;

      font-weight:600;
      font-size:16px;

      cursor:pointer;
      user-select:none;
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

      background: #1C1B1F;

      border:2px solid #656565;
      border-radius:16px;

      overflow:hidden;
      z-index:10;
    }

    .option{
      padding:12px 16px;
      font-size:16px;
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

      background: #343239;
      border-radius:16px;

      display:flex;
      justify-content:center;
      align-items:center;

      cursor:pointer;
      transition:0.2s;
    }

    .power.active{
      background: #e65332;
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

  _selectCoffee(e,type){
    e.stopPropagation();
    this.selectedCoffee = type;
    this._expectedCoffee = type;
    this.open = false;
    const coffeeEntity = this.config?.coffee_entity;
    if(!this.hass?.states?.[coffeeEntity]) return;

    this.hass.callService("select","select_option",{
      entity_id: coffeeEntity,
      option: type
    });
  }

  render(){

    return html`

      <div class="card">

        <div class="header">
          <div class="title">Кофеварка</div>
          <div class="state">
            ${this.power ? "Готовит" : "Выключено"}
          </div>
        </div>

        <div class="controls">
          <div class="select" @click=${this._toggleSelect}>
            <div>${this.selectedCoffee}</div>
            <div class="arrow ${this.open ? "open" : ""}"></div>
            ${this.open ? html`
              <div class="dropdown">
                ${this.coffeeTypes.map(type => html`
                  <div
                    class="option ${this.selectedCoffee===type ? "selected":""}"
                    @click=${(e)=>this._selectCoffee(e,type)}
                  >
                    ${type}
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

customElements.define("emelya-coffee-card", EmelyaCoffeeCard);

/*
Примерный конфиг
type: custom:emelya-coffee-card
base_path: /local/emelya-cards-test
entity: switch.coffee_machine
coffee_entity: select.coffee_type
*/