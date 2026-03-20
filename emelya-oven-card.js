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
    this.temp = 180;
    this.timer = 45;

    this._holdInterval = null;
    this._holdTimeout = null;
    this._expectedPower = null;
    this._expectedTemp = null;
    this._expectedTimer = null;

    this._lastUserChange = 0;
    this._dragging = false;
    this._lastServiceCallTemp = 0;
    this._lastServiceCallTimer = 0;

    this._pendingTemp = null;
    this._pendingTimer = null;
  }

  setConfig(config){
    this.config = config || {};
    this.base = config.base_path || "/local";
  }

  set hass(hass){
    this._hass = hass;

    const entity = this.config?.entity;
    const stateObj = hass.states?.[entity];

    const now = Date.now();
    const ignore = (now - this._lastUserChange) < 800;

    // POWER 
    if(stateObj){
      const newPower = stateObj.state !== "off";

      if(this._expectedPower !== null){
        if(newPower !== this._expectedPower) return;
        this._expectedPower = null;
      }

      this.power = newPower;

      // TEMP
      const newTemp = stateObj.attributes?.temperature;

      if(newTemp !== undefined){

        if(this._expectedTemp !== null){

          if(Math.abs(newTemp - this._expectedTemp) > 1) return;

          this._expectedTemp = null;

        } else if(!ignore && !this._dragging){

          this.temp = newTemp;

        }
      }
    }

    // TIMER 
    const timerEntity = this.config?.timer_entity;
    const timerState = hass.states?.[timerEntity];

    if(timerState?.state !== undefined){

      const newTimer = Number(timerState.state);

      if(this._expectedTimer !== null){

        if(Math.abs(newTimer - this._expectedTimer) > 1) return;

        this._expectedTimer = null;

      } else if(!ignore && !this._dragging){

        this.timer = newTimer;

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
      height:250px;
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
    }

    .value{
      min-width:40px;
      font-size:12px;
      text-align:center;
    }

    .arrow{
      width:16px;
      height:16px;
      display:flex;
      justify-content:center;
      align-items:center;
      cursor:pointer;
    }

    .arrow.up::before{
      content:"";
      border-left:6px solid transparent;
      border-right:6px solid transparent;
      border-bottom:8px solid white;
    }

    .arrow.down::before{
      content:"";
      border-left:6px solid transparent;
      border-right:6px solid transparent;
      border-top:8px solid white;
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
    }

    .power.active{
      background: #e65332;
    }

    .power img{
      width:28px;
    }

  `;

  _startHold(action){
    this._holdTimeout = setTimeout(()=>{
      this._holdInterval = setInterval(action,40);
    },300);
  }

  _stopHold(){
    clearTimeout(this._holdTimeout);
    clearInterval(this._holdInterval);

    this._holdTimeout = null;
    this._holdInterval = null;

    const entity = this.config?.entity;
    const timerEntity = this.config?.timer_entity;

    if(this._pendingTemp !== null && this.hass?.states?.[entity]){
      this._expectedTemp = this._pendingTemp;

      this.hass.callService("climate","set_temperature",{
        entity_id: entity,
        temperature: this._pendingTemp
      });
    }

    if(this._pendingTimer !== null && this.hass?.states?.[timerEntity]){
      this._expectedTimer = this._pendingTimer;

      this.hass.callService("number","set_value",{
        entity_id: timerEntity,
        value: this._pendingTimer
      });
    }

    this._pendingTemp = null;
    this._pendingTimer = null;

    this._dragging = false;
    this._lastUserChange = Date.now();
  }

  _click(action){
      action();
  }

  _callService(service,data){

    const entity = this.config?.entity;

    if(!this.hass || !entity) return;

    this.hass.callService("oven",service,{
      entity_id:entity,
      ...data
    });

  }

  _togglePower(){
    const newPower = !this.power;
    this.power = newPower;

    const entity = this.config?.entity;

    if(this.hass?.states?.[entity]){
      this._expectedPower = newPower;

      this.hass.callService("climate","set_hvac_mode",{
        entity_id: entity,
        hvac_mode: newPower ? "heat" : "off"
      });
    }
  }

  _changeTemp(delta){

    this.temp += delta;
    if(this.temp < 0) this.temp = 0;

    this._dragging = true;
    this._lastUserChange = Date.now();

    const entity = this.config?.entity;
    const now = Date.now();

    this._pendingTemp = this.temp;

    if (now - this._lastServiceCallTemp > 250) {

      this._lastServiceCallTemp = now;

      if(this.hass?.states?.[entity]){
        this._expectedTemp = this.temp;

        this.hass.callService("climate","set_temperature",{
          entity_id: entity,
          temperature: this.temp
        });
      }
    }
  }

  _changeTimer(delta){

    this.timer += delta;
    if(this.timer < 0) this.timer = 0;

    this._dragging = true;
    this._lastUserChange = Date.now();

    const entity = this.config?.timer_entity;
    const now = Date.now();

    this._pendingTimer = this.timer;

    if (now - this._lastServiceCallTimer > 250) {

      this._lastServiceCallTimer = now;

      if(this.hass?.states?.[entity]){
        this._expectedTimer = this.timer;

        this.hass.callService("number","set_value",{
          entity_id: entity,
          value: this.timer
        });
      }
    }
  }

  render(){
    const bg = `${this.base}/images/container-images/oven.png`;

    return html`
      <div class="card" style="background:
        linear-gradient(180deg, rgba(28,27,31,0) 62.6%, #1C1B1F 100%),
        url('${bg}') center/cover no-repeat,
        #1C1B1F;">

        <div class="header">
          <div class="title">Духовой шкаф</div>
          <div class="state">
            ${this.power ? "Включено" : "Выключено"}
          </div>
        </div>

        <div class="controls">

          <div class="box">

            <div
              class="arrow down"
              @click=${()=>this._click(()=>this._changeTemp(-1))}
              @mousedown=${()=>this._startHold(()=>this._changeTemp(-1))}
              @mouseup=${this._stopHold}
              @mouseleave=${this._stopHold}
            ></div>

            <div class="value">
              ${this.temp} °C
            </div>

            <div
              class="arrow up"
              @click=${()=>this._click(()=>this._changeTemp(1))}
              @mousedown=${()=>this._startHold(()=>this._changeTemp(1))}
              @mouseup=${this._stopHold}
              @mouseleave=${this._stopHold}
            ></div>

          </div>

          <div class="box">

            <div
              class="arrow down"
              @click=${()=>this._click(()=>this._changeTimer(-1))}
              @mousedown=${()=>this._startHold(()=>this._changeTimer(-1))}
              @mouseup=${this._stopHold}
              @mouseleave=${this._stopHold}
            ></div>

            <div class="value">
              ${this.timer} мин
            </div>

            <div
              class="arrow up"
              @click=${()=>this._click(()=>this._changeTimer(1))}
              @mousedown=${()=>this._startHold(()=>this._changeTimer(1))}
              @mouseup=${this._stopHold}
              @mouseleave=${this._stopHold}
            ></div>

          </div>

          <div
            class="power ${this.power ? "active":""}"
            @click=${this._togglePower}
          >
            <img src="${this.base}/images/container-images/power_button.png">
          </div>

        </div>

      </div>

    `;
  }

}

customElements.define("emelya-oven-card", EmelyaOvenCard);

/* 
type: custom:emelya-oven-card
entity: climate.oven
timer_entity: number.oven_timer
*/