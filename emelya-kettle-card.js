import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";

class EmelyaKettleCard extends LitElement {

  static properties = {
    hass: {},
    config: {},
    power: { type: Boolean },
    temperature: { type: Number }
  };

  constructor(){
    super();
    this.power = false;
    this.temperature = 0;
    this._expectedPower = null;
  }

  setConfig(config){
    this.config = config || {};
    this.base = config.base_path || "/local";
  }

  set hass(hass){
    this._hass = hass;

    //  POWER 
    const powerEntity = this.config.power_entity || this.config.entity;
    const powerStateObj = hass.states?.[powerEntity];
    if(powerStateObj){
      let newPower = false;
      const domain = powerEntity.split(".")[0];

      if(domain === "climate") {
        newPower = powerStateObj.state !== "off"; // climate: off / heat / etc
      } else if(domain === "switch" || domain === "input_boolean") {
        newPower = powerStateObj.state === "on";
      } else {
        // универсально: все остальные домены
        newPower = powerStateObj.state !== "off" && powerStateObj.state !== "unavailable";
      }

      if(this._expectedPower !== null){
        if(newPower === this._expectedPower) this._expectedPower = null;
      }
      this.power = newPower;
    }
    //  TEMP 
    const tempEntity = this.config.temp_entity || this.config.entity;
    const tempStateObj = hass.states?.[tempEntity];
    if(tempStateObj){
      let newTemp = 0;
      const domain = tempEntity.split(".")[0];

      if(domain === "climate") {
        newTemp = tempStateObj.attributes?.temperature ?? 0;
      } else {
        newTemp = Number(tempStateObj.state) || 0;
      }

      this.temperature = newTemp;
    }

  }

  get hass(){
    return this._hass;
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
      justify-content:space-between;
    }

    .box{
      height:56px;
      width: 80px;
      background: #1C1B1F;
      border-radius:16px;
      display:flex;
      justify-content:center;
      align-items:center;
      border:1px solid #656565;
      font-weight:600;
    }

    .temp{
      flex-direction:row;
    }

    .value{
      min-width:40px;
      text-align:center;
      font-weight:600;
    }

    .power{
      width:80px;
      height:56px;
      background:#343239;
      border-radius:16px;
      display:flex;
      justify-content:center;
      align-items:center;
      cursor:pointer;
      transition:background 0.2s;
    }

    .power.active{
      background:#E65332;
    }

    img{
      width:24px;
      height:24px;
    }

  `;

  _toggle(e){
    e.stopPropagation();
    const newPower = !this.power;
    this.power = newPower;
    this._expectedPower = newPower;

    const entity = this.config.power_entity || this.config.entity;
    if(!this.hass?.states?.[entity]) return;

    const domain = entity.split(".")[0];

    if(domain === "climate") {
      // включаем/выключаем через set_hvac_mode
      this.hass.callService("climate","set_hvac_mode",{
        entity_id: entity,
        hvac_mode: newPower ? "heat" : "off"
      });
    } else if(domain === "switch" || domain === "input_boolean") {
      // стандартные сущности
      this.hass.callService("homeassistant", newPower ? "turn_on":"turn_off",{
        entity_id: entity
      });
    } else {
      // универсально для других доменов
      this.hass.callService(domain, newPower ? "turn_on":"turn_off",{
        entity_id: entity
      });
    }
  }
  _click(action){
    action();
  }
  _fireMoreInfo(entityId){
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId },
      bubbles: true,
      composed: true
    }));
  }

  _handleCardClick(e){
    if(e.target.closest("div.box.temp")) return;
    const entity = this.config?.entity;
    if(!entity) return;
    this._fireMoreInfo(entity);
  }

  _handleSelectClick(e){
    e.stopPropagation();
    if(this.config.temp_entity){
      this._fireMoreInfo(this.config.temp_entity);
    } else if(this.config.entity){ 
      this._fireMoreInfo(this.config.entity);
    }
  }

  render(){

    return html`

      <div class="card" @click=${this._handleCardClick}>

        <div class="header">
          <div class="title">Чайник</div>
          <div class="state">
            ${this.power ? "Нагревает" : "Выключено"}
          </div>
        </div>

        <div class="controls">
          <div class="box temp" @click=${this._handleSelectClick}>
            <div class="value">
              ${this.temperature} °C
            </div>
          </div>

          <div class="power ${this.power ? "active" : ""}" @click=${this._toggle}>
            <img src="${this.base}/images/container-images/power_button.png">
          </div>

        </div>

      </div>

    `;
  }

}

customElements.define("emelya-kettle-card", EmelyaKettleCard);
/*
type: custom:emelya-kettle-card
base_path: /local
entity: climate.kettle   # или switch.kettle
power_entity: switch.kettle     # необязательный
temp_entity: number.kettle_temp # необязательный
*/