import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";
class EmelyaOvenCard extends LitElement {

  static properties = {
    hass: {},
    config: {},
    power: { type:Boolean },
    temp: { type:Number },
    timer: { type:Number }
  };

  constructor(){
    super();
    this.power = false;
    this.temp = 0;
    this.timer = 0;
    this._expectedPower = null;
    this._expectedTemp = null;
    this._expectedTimer = null;
  }

  setConfig(config){
    this.config = config || {};
    this.base = config.base_path || "/local";
  }

  set hass(hass){
    this._hass = hass;

    // POWER
    const powerEntity = this.config.power_entity || this.config.entity;
    const powerStateObj = hass.states?.[powerEntity];
    if(powerStateObj){
      const newPower = powerStateObj.state !== "off";
      if(this._expectedPower !== null){
        if(newPower !== this._expectedPower) return;
        this._expectedPower = null;
      }
      this.power = newPower;
    }

    // TEMP
    const tempEntity = this.config.temp_entity || this.config.entity;
    const tempStateObj = hass.states?.[tempEntity];
    if(tempStateObj){
      let newTemp = 0;
      const domain = tempEntity.split(".")[0];
      if(domain === "climate") newTemp = tempStateObj.attributes?.temperature ?? 0;
      else newTemp = Number(tempStateObj.state) || 0;
      this.temp = newTemp;
    }

    // TIMER
    const timerEntity = this.config.timer_entity;
    if(timerEntity){
      const timerStateObj = hass.states?.[timerEntity];
      if(timerStateObj) this.timer = Number(timerStateObj.state) || 0;
    }
  }

  get hass(){ return this._hass; }
    static styles = css`
    :host { 
      border-radius: 24px !important;
      border: none !important;
    }
    .card{
      width:320px;
      box-sizing:border-box;
      display:flex;
      flex-direction:column;
      justify-content:space-between;
      padding:16px;
      height:250px;
      border-radius: 24px !important;
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

    .box{
      flex:1;
      height:52px;
      background: #343239;
      border-radius:16px;
      display:flex;
      width:96px;
      justify-content:center;
      align-items:center;
      gap:4px;
      font-weight:600;
      position: relative;
    }
    .box::before {
      content: "" !important;
      position: absolute !important;
      inset: 0 !important;
      padding: 1px !important;
      border-radius: inherit !important;
      background: linear-gradient(165deg, rgba(101, 101, 101, 0) 0%, #656565 50%, rgba(101, 101, 101, 0) 100%) !important;
      pointer-events: none !important;
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor !important;
      mask-composite: exclude !important;
    }

    .value{
      min-width:40px;
      font-size:12px;
      text-align:center;
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
      transition: 0.2s;
      position: relative;
    }
    .power::before {
      content: "" !important;
      position: absolute !important;
      inset: 0 !important;
      padding: 1px !important;
      border-radius: inherit !important;
      background: linear-gradient(165deg, rgba(101, 101, 101, 0) 0%, #656565 50%, rgba(101, 101, 101, 0) 100%) !important;
      pointer-events: none !important;
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor !important;
      mask-composite: exclude !important;
    }

    .power.active{
      background: #e65332;
    }

    .power img{
      width:28px;
    }

  `;

  _togglePower(e){
    e.stopPropagation();
    const newPower = !this.power;
    this.power = newPower;

    const entity = this.config.power_entity || this.config.entity;
    if(!this.hass?.states?.[entity]) return;
    this._expectedPower = newPower;

    const domain = entity.split(".")[0];

    if(domain === "climate"){
      this.hass.callService("climate","set_hvac_mode",{
        entity_id: entity,
        hvac_mode: newPower ? "heat" : "off"
      });
    } else if(domain === "switch" || domain === "input_boolean"){
      this.hass.callService("homeassistant", newPower ? "turn_on":"turn_off", {
        entity_id: entity
      });
    } else {
      console.warn("Неизвестный домен для power:", domain);
    }
  }

  _fireMoreInfo(entityId){
    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId },
      bubbles: true,
      composed: true
    }));
  }

  _handleCardClick(e){
    if(e.target.closest("div.box")) return;
    const entity = this.config.entity || this.config.power_entity;
    if(entity) this._fireMoreInfo(entity);
  }

  _handleTempClick(e){
    e.stopPropagation();
    if(this.config.temp_entity){
      this._fireMoreInfo(this.config.temp_entity);
    } else if(this.config.entity){ 
      this._fireMoreInfo(this.config.entity);
    }
  }

  _handleTimerClick(e){
    e.stopPropagation();
    if(this.config.timer_entity) this._fireMoreInfo(this.config.timer_entity);
  }

  render(){
    const bg = `${this.base}/images/container-images/oven.png`;
    return html`
      <div class="card" @click=${this._handleCardClick}
        style='
          background-image:
            url("${bg}"),
            linear-gradient( #1C1B1F, #1C1B1F),
            linear-gradient(135deg, rgba(101, 101, 101, 0) 0%, #656565 50%, rgba(101, 101, 101, 0) 100%);
          background-size: cover, auto, auto;
          background-position: center;
          background-repeat: no-repeat;
          border: 1px solid transparent;
          background-origin: border-box;
          background-clip: padding-box, padding-box, border-box;
          border-radius: 24px !important;
        '>
        <div class="header">
          <div class="title">Духовой шкаф</div>
          <div class="state">${this.power ? "Включено":"Выключено"}</div>
        </div>
        <div class="controls">
          <div class="box" @click=${this._handleTempClick}>
            <div class="value">${this.temp} °C</div>
          </div>
          <div class="box" @click=${this._handleTimerClick}>
            <div class="value">${this.timer} мин</div>
          </div>
          <div class="power ${this.power?"active":""}" @click=${this._togglePower}>
            <img src="${this.base}/images/container-images/power_button.png">
          </div>
        </div>
      </div>
    `;
  }

}

customElements.define("emelya-oven-card", EmelyaOvenCard);

/* 
# вариант 1: классическая climate духовка
type: custom:emelya-oven-card
entity: climate.oven
timer_entity: number.oven_timer

# вариант 2: кастомная ESPHome духовка
type: custom:emelya-oven-card
power_entity: switch.oven
temp_entity: number.oven_temp
timer_entity: number.oven_timer
*/





