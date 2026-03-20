import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";

import { MIN, MAX, START, END, SWEEP, polar, arcPath, clamp } from './constants.js';

export class EmelyaConvectorCard extends LitElement {
  static properties = { 
    temp: { type: Number },
    active: { type: Boolean },
    hass: {},
    config: {},
  };
  constructor(){
    super();
    this.temp = 20;
    this._svg = null;
    this.active=false;
    this.dragging = false;
    this._lastUserChange = 0;
    this._expectedActive = null;
  }

  setConfig(config){
    if(!config.entity){
      console.warn("emelya-convector-card: entity not specified");
    }

    this.config = config;
  }
  set hass(hass){
    this._hass = hass;

    const entity = this.config?.entity;
    if(!entity) return;

    const stateObj = hass.states?.[entity];
    if(!stateObj) return;
    const newActive = stateObj.state !== "off";

    if(this._expectedActive !== null){
      if(newActive !== this._expectedActive){
        return;
      }
      this._expectedActive = null;
    }

    this.active = newActive;
    const now = Date.now();
    const ignoreUpdate = (now - this._lastUserChange) < 1000;

    const temp = stateObj.attributes?.temperature;

    if(!this.dragging && !ignoreUpdate && temp !== undefined){
      // фильтр от дребезга
      if(Math.abs(this.temp - temp) > 0.5){
        this.temp = temp;
      }
    }
  }

  get hass(){
    return this._hass;
  }

  static styles = 
    css`
      :host { position: relative; display: block;
        background: #343239;
        max-width:320px;
        width:100%;
        padding-bottom:12px;
        border-radius: 24px;
      }

      .card {
        padding: 16px;
        padding-top:0px;
        padding-bottom:0px;
        position: relative;
      }

      svg {
        width: 100%;
        height: 260px;
        display: block;
        margin: 0 auto;
        touch-action: none;
      }

      .center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        transform: translateY(-10px);
      }

      .value { 
        font-size: 64px; 
        font-weight: 600; 
        line-height: 1; 
        color: white;
      }
      
      .target { 
        opacity: 0.5; 
        font-size: 20px; 
        color: white;
      }

      .controls {
        position: absolute;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 16px;
        width: 140px;
        justify-content: center;
      }
      .controls div{
        display:flex;
        flex-direction:row;
        align-items:center;
      }
      .controls div > :first-child {
        margin-right: 16px;
      }


      .btn {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #4d4a54;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        color: white;
        transition: background 0.2s;
      }

      .btn:active { background: #5d5a64; }
      .btn.disabled { opacity: 0.4; pointer-events: none; }
      @media (max-width: 500px) {
        .card {
          padding: 12px;
        }
        
        .value {
          font-size: 48px; 
        }
        
        svg {
          width: 200px;
          height: 200px;
        }
        
        .controls {
          bottom: 8px;
        }
      }
    .title{
        padding-top:15px;
        padding-left:15px;
        font-size:16px;
        font-weight:600;
        color:white;
        margin-bottom:8px;
    }

    .power{
        margin:0 auto;
        width:56px;
        height:56px;
        border-radius:50%;
        background: #4d4a54;
        display:flex;
        align-items:center;
        justify-content:center;
        cursor:pointer;
        transition:background 0.2s;
    }

    .power:hover{
        background: #5d5a64;
    }

    .power img{
        width:24px;
        height:24px;
    }
    .power.active{
        background: #e65332;
    }
    `

  firstUpdated() {
    this._svg = this.renderRoot.querySelector('svg');
  }

  angleFromTemp(t) {
    return START + ((t - MIN) / (MAX - MIN)) * SWEEP;
  }

  tempFromEvent(e) {
    if (!this._svg) return this.temp;

    const rect = this._svg.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = e.clientX - rect.left - cx;
    const dy = e.clientY - rect.top - cy;

    let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;
    if (angle >= 360) angle -= 360;

    let normalizedAngle = angle;
    
    if (normalizedAngle < START) {
      normalizedAngle += 360;
    }
    
    if (normalizedAngle < START || normalizedAngle > END) {
      return this.temp;
    }

    const relativeAngle = normalizedAngle - START;
    const temp = Math.round(MIN + (relativeAngle / SWEEP) * (MAX - MIN));
    
    return clamp(temp, MIN, MAX);
  }
  _sendTemperature(temp){

    const entity = this.config?.entity;
    if(!entity || !this.hass?.states?.[entity]) return;

    this.hass.callService("climate","set_temperature",{
      entity_id: entity,
      temperature: temp
    });

  }

  startDrag(e) {
    if(!this.active) return;

    const move = ev => { 
      ev.preventDefault();
      this.dragging = true;
      this.temp = this.tempFromEvent(ev); 
    };
    
    const stop = () => {
      this.dragging = false;
      this._lastUserChange = Date.now();

      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);

      this._sendTemperature(this.temp);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);

    move(e);
  }

  change(d){
    if(!this.active) return;

    this.temp = clamp(this.temp + d, MIN, MAX);
    this._lastUserChange = Date.now();

    this._sendTemperature(this.temp);
  }
  togglePower(){
    this.active = !this.active;
    this._expectedActive = this.active;

    const entity = this.config?.entity;
    if(!entity || !this.hass?.states?.[entity]) return;

    const service = this.active ? "turn_on" : "turn_off";

    this.hass.callService("climate", service, {
      entity_id: entity
    });
  }

  render() {
    const angle = this.angleFromTemp(this.temp);
    const handlePos = polar(120, 120, 100, angle);

    const fixedAngle = this.angleFromTemp(22);
    const fixedPos = polar(120, 120, 100, fixedAngle);
    
    const btnClass = this.active ? 'btn' : 'btn disabled';

    return html`
    <div class="title">
        Теплый пол
    </div>
    <div class="card" style="position:relative;">

        <div style="position:relative;">
            <svg viewBox="0 0 240 240" @pointerdown=${this.startDrag}>
                <path d="${arcPath(100, START, END)}" stroke="#4d4a54" stroke-width="14" fill="none" stroke-linecap="round"/>
                <path d="${arcPath(100, START, angle)}" stroke="#e65332" stroke-width="14" fill="none" stroke-linecap="round"/>
                <circle cx=${fixedPos.x} cy=${fixedPos.y} r="7" fill="gray" opacity="0.6" />
                <circle cx=${handlePos.x} cy=${handlePos.y} r="11" fill="white" stroke="#e65332" stroke-width="2" />
            </svg>

            <div class="center">
                <div class="value">${this.temp}°</div>
                <div class="target">22°</div>
            </div>

            <div class="controls">
              <div>
              <div>${MIN}°</div>
              <div class="${btnClass}" @click=${() => this.change(-1)}>−</div>
              </div>
              <div>
              <div class="${btnClass}" @click=${() => this.change(1)}>+</div>
              <div>${MAX}°</div>
              </div>
            </div>          
        </div>
    </div>
    <div class="power ${this.active ? "active":""}" @click=${this.togglePower}>
        <img src="/local/images/container-images/power_button.png">
    </div>
    `;
  }
}

customElements.define('emelya-convector-card', EmelyaConvectorCard);