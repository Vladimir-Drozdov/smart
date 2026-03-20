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
    this._stopHold = this._stopHold.bind(this);
    this.power = false;
    this.temperature = 0;
    this._editingTemp = false;
    this._expectedPower = null;
    this._holdInterval = null;
    this._holdTimeout = null;
  }

  setConfig(config){
    this.config = config || {};
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

    const tempEntity = this.config?.temp_entity;
    const tempState = hass.states?.[tempEntity];

    if(tempState && !this._editingTemp){
      const val = Number(tempState.state);
      if(!isNaN(val)){
        this.temperature = val;
      }
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
      background:#e65332;
    }

    img{
      width:24px;
      height:24px;
    }

  `;

  _toggle(){
    const newPower = !this.power;
    this.power = newPower;
    this._expectedPower = newPower;
    const entity = this.config?.entity;
    if(!this.hass?.states?.[entity]) return;

    const domain = entity.split(".")[0];
    const service = newPower ? "turn_on" : "turn_off";

    this.hass.callService(domain, service, {
      entity_id: entity
    });
  }

  _startHold(delta){
    window.addEventListener("mouseup", this._stopHold);
    this._editingTemp = true;

    this._holdTimeout = setTimeout(()=>{
      this._holdInterval = setInterval(()=>{
        this._changeTemp(delta);
      },40);
    },300);

  }

  _stopHold(){
    window.addEventListener("mouseup", this._stopHold);
    clearTimeout(this._holdTimeout);
    clearInterval(this._holdInterval);

    this._holdTimeout = null;
    this._holdInterval = null;

    this._commitTemp();

    this._editingTemp = false;
  }
  _changeTemp(delta){
    if(!this.power) return;
    const tempEntity = this.config?.temp_entity;
    const tempState = this.hass?.states?.[tempEntity];
    const step = tempState?.attributes?.step ?? 1;
    const max = tempState?.attributes?.max ?? 100;
    const min = tempState?.attributes?.min ?? 0;
    let newTemp = this.temperature + delta * step;
    if(newTemp > max) newTemp = max;
    if(newTemp < min) newTemp = min;
    this.temperature = newTemp;
  }
  _commitTemp(){
    clearTimeout(this._commitTimer);

    this._commitTimer = setTimeout(()=>{
      const tempEntity = this.config?.temp_entity;
      if(!this.hass || !tempEntity) return;

      const stateObj = this.hass.states?.[tempEntity];
      if(!stateObj) return;

      if(stateObj.state === "unavailable" || stateObj.state === "unknown"){
        return;
      }

      this.hass.callService("number","set_value",{
        entity_id: tempEntity,
        value: this.temperature
      });
    }, 150);
  }

  _click(action){
    action();
  }

  render(){

    return html`

      <div class="card">

        <div class="header">
          <div class="title">Чайник</div>
          <div class="state">
            ${this.power ? "Нагревает" : "Выключено"}
          </div>
        </div>

        <div class="controls">

          <div class="box temp">

            <div
              class="arrow up"
              @click=${()=>{
                this._changeTemp(1);
                this._commitTemp();
              }}
              @mousedown=${()=>this._startHold(1)}
              @mouseup=${this._stopHold}
              @mouseleave=${this._stopHold}
            ></div>

            <div class="value">
              ${this.temperature} °C
            </div>

            <div
              class="arrow down"
              @click=${()=>{
                this._changeTemp(-1);
                this._commitTemp();
              }}
              @mousedown=${()=>this._startHold(-1)}
              @mouseup=${this._stopHold}
              @mouseleave=${this._stopHold}
            ></div>

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