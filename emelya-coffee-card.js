import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";

class EmelyaCoffeeCard extends LitElement {

  static properties = {
    hass: {},
    config: {},
    selectedCoffee: {},
    power: { type:Boolean },
    coffeeTypes: { state:true }
  };

  constructor(){
    super();

    this.power = false;
    this.coffeeTypes = [];

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
      background: #E65332;
    }

    ha-select {
      width:200px;
    }
  `;

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
  _handleSelectDblClick(e){
    e.stopPropagation();
    this._fireMoreInfo(this.config.coffee_entity);
  }

  _handleSelectChange(e){
    e.stopPropagation();

    const value = e.target.value;
    this.selectedCoffee = value;
    this._expectedCoffee = value;

    const coffeeEntity = this.config?.coffee_entity;
    if(!this.hass?.states?.[coffeeEntity]) return;

    this.hass.callService("select","select_option",{
      entity_id: coffeeEntity,
      option: value
    });
  }

  _toggle(e){
    e.stopPropagation();

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

  render(){

    const coffeeState = this.hass?.states?.[this.config.coffee_entity];

    return html`
    <ha-card>
      <div class="card" @click=${this._handleCardClick}>

        <div class="header">
          <div class="title">Кофеварка</div>
          <div class="state">
            ${this.power ? "Готовит" : "Выключено"}
          </div>
        </div>

        <div class="controls">

          ${coffeeState ? html`
            <ha-select
              .label=${coffeeState.attributes.friendly_name}
              .value=${coffeeState.state}
              @dblclick=${this._handleSelectDblClick}
              @change=${this._handleSelectChange}
            >
              ${(coffeeState.attributes.options || []).map((opt) => html`
                <mwc-list-item .value=${opt}>
                  ${opt}
                </mwc-list-item>
              `)}
            </ha-select>
          ` : ""}

          <div class="power ${this.power ? "active":""}" @click=${this._toggle}>
            <img src="${this.base}/images/container-images/power_button.png">
          </div>

        </div>

      </div>
    </ha-card>
    `;
  }

}

customElements.define("emelya-coffee-card", EmelyaCoffeeCard);