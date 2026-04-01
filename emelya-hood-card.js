import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";
const LEVEL_MAP = {1:33, 2:66, 3:100};
class EmelyaHoodCard extends LitElement {

  static properties = {
    hass: {},
    config: {},
    level: { type:Number },
    power: { type:Boolean }
  };

  constructor(){
    super();
    this.level = 0;
    this.power = false;
    this._expectedPower = null;
    this._expectedLevel = null;
  }
  set hass(hass){
    this._hass = hass;

    const entity = this.config?.entity;
    const stateObj = hass.states?.[entity];

    if(!stateObj) return;
    const newPower = stateObj.state === "on";

    if(this._expectedPower !== null){
      if(newPower === this._expectedPower){
        this._expectedPower = null;
        this.power = newPower;
      }
    } else {
      this.power = newPower;
    }
    const percentage = stateObj.attributes?.percentage ?? 0;

    let newLevel = 0;
    if(percentage > 0 && percentage <= 33) newLevel = 1;
    else if(percentage <= 66) newLevel = 2;
    else if(percentage > 66) newLevel = 3;

    if(this._expectedLevel !== null){
      if(newLevel === this._expectedLevel){
        this._expectedLevel = null;
        this.level = newLevel;
      }
    } else {
      this.level = newLevel;
    }
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
      font-family:Roboto;
      color:white;
    }

    .frame{
      box-sizing:border-box;
      display:flex;
      flex-direction:column;
      justify-content:space-between;

      padding:16px;
      height:264px;
      background-size:cover;
      background-position:center;
      border-radius:24px;
    }

    .title{
      font-weight:600;
      font-size:16px;
    }

    .controls{
      display:flex;
      padding:4px;
      gap:8px;
      height:56px;
    }

    .btn{
      flex:1;
      display:flex;
      justify-content:center;
      align-items:center;
      height:48px;
      border-radius:12px;
      cursor:pointer;
      transition:0.2s;
      background:transparent;
    }

    .btn:hover{
      background:#343239;
    }

    .btn.active{
      background:#343239;
    }

    .btn.power.active{
      background: #E65332;
    }

    .icon{
      width:22px;
      height:22px;
    }

    .circle{
      border:2px solid white;
      border-radius:50%;
      opacity:0.25;
      transition:0.2s;
    }

    .circle.small{
      width:10px;
      height:10px;
    }

    .circle.medium{
      width:14px;
      height:14px;
    }

    .circle.big{
      width:18px;
      height:18px;
    }

    .enabled .circle{
      opacity:0.8;
    }

    .btn.active .circle{
      opacity:1;
      border-color: #E65332;
    }

  `;

  _togglePower(e){
    e.stopPropagation();
    const entity = this.config?.entity;
    const newPower = !this.power;

    this.power = newPower;
    this._expectedPower = newPower;

    if(!newPower){
      this.level = 0;
      this._expectedLevel = 0;
    }
    if(!this.hass || !entity) return;
    const service = newPower ? "turn_on" : "turn_off";

    this.hass.callService("fan", service, {
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
    if(e.target.closest("div.btn")) return;
    const entity = this.config?.entity;
    if(!entity) return;
    this._fireMoreInfo(entity);
  }


  _setLevel(level){
    this.level = level;
    this._expectedLevel = level;
    if(!this.power) return;

    const entity = this.config?.entity;
    if(!this.hass || !entity) return;
    this.hass.callService("fan","set_percentage",{
      entity_id:entity,
      percentage: LEVEL_MAP[level]
    });
  }

  render(){
    const bg = `${this.base}/images/container-images/kitchen-hood.png`;
    return html`

      <div
        class="frame" @click=${this._handleCardClick}
        style="
          background:
            url('${bg}'),
            #1C1B1F;
          background-size: cover;
          background-position: center;
        "
      >

        <div class="title">
          Вытяжка
        </div>

        <div class="controls ${this.power ? "enabled":""}">

          <div
            class="btn power ${this.power ? "active":""}"
            @click=${this._togglePower}
          >
            <img class="icon" src="${this.base}/images/container-images/power_button.png">
          </div>

          <div
            class="btn ${this.level===1 ? "active":""}"
            @click=${()=>this._setLevel(1)}
          >
            <div class="circle small"></div>
          </div>

          <div
            class="btn ${this.level===2 ? "active":""}"
            @click=${()=>this._setLevel(2)}
          >
            <div class="circle medium"></div>
          </div>

          <div
            class="btn ${this.level===3 ? "active":""}"
            @click=${()=>this._setLevel(3)}
          >
            <div class="circle big"></div>
          </div>

        </div>

      </div>

    `;
  }

}

customElements.define("emelya-hood-card", EmelyaHoodCard);