import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";

class EmelyaLightStrip extends LitElement {

  static properties = {
    hass: {},
    config: {},
    power: {state:true},
    brightness: {state:true}
  };

  constructor(){
    super();
    this.power = false;
    this.brightness = 50;
    this._lastUserChange = 0;
    this.dragging = false;
    this._expectedPower = null;
  }

  setConfig(config){
    this.config = config || {};
  }

    set hass(hass){
        this._hass = hass;
        const entity = this.config?.entity;
        const stateObj = hass.states?.[entity];
        if(!stateObj) return;
        const now = Date.now();
        const ignoreUpdate = (now - this._lastUserChange) < 1000;
        const newPower = stateObj.state === "on";
        if(this._expectedPower !== null){
            // если HA ещё не догнал — игнорируем
            if(newPower !== this._expectedPower){
                return;
            }
            // HA догнал → сбрасываем ожидание
            this._expectedPower = null;
        }
        this.power = newPower;
        const bri = stateObj?.attributes?.brightness;
        if(!this.dragging && !ignoreUpdate && bri !== undefined){
            this.brightness = Math.round((bri / 255) * 100);
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

    .frame {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 16px;
      background: #1C1B1F;
      border-radius: 24px;
      color: white;
      font-family: Roboto;
    }

    .header{
      display:flex;
      align-items:center;
      gap:12px;
    }

    .icon{
      width:64px;
      height:64px;
      border-radius:16px;
      background: #343239;

      display:flex;
      align-items:center;
      justify-content:center;

      cursor:pointer;
      transition:0.2s;
    }

    .icon.iconActive{
      background: #E65332;
    }

    .title{
      font-size:16px;
      font-weight:600;
    }

    .subtitle{
      font-size:14px;
      opacity:0.6;
    }

    .section{
      display:flex;
      flex-direction:column;
      gap:8px;
    }

    .row{
      display:flex;
      justify-content:space-between;
      font-size:16px;
      font-weight:600;
    }

    .value{
      opacity:0.5;
      font-weight:400;
    }

    .bar{
      position:relative;
      width:100%;
      height:64px;
      background: #1C1B1F;
      border-radius:16px;
      border:1px solid white;
      overflow:hidden;
      cursor:pointer;
    }

    .bar.disabled{
      opacity:0.4;
      cursor:default;
    }

    .active{
      position:absolute;
      height:100%;
      width:100%;
      left:0;
      top:0;
      background: #343239;
      transform-origin:left center;
      border-radius:16px;
    }

    .drag {
      position: absolute;
      width: 6px;
      height: 32px;
      top: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 24px;
      pointer-events: none;
    }

    .color-section{
      display:flex;
      justify-content:center;
    }

    .color-wheel{
      width:200px;
      height:200px;
      border-radius:50%;
      cursor:pointer;
      position:relative;

      background:
        conic-gradient(
          red,
          yellow,
          lime,
          cyan,
          blue,
          magenta,
          red
        );
    }

    .color-wheel::after{
      content:"";
      position:absolute;
      inset:20%;
      border-radius:50%;
      background: #1C1B1F;
    }

  `;
  //Function of calculating a rgb color
  _hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [
      Math.round(255 * f(0)),
      Math.round(255 * f(8)),
      Math.round(255 * f(4))
    ];
  }

  _pickColor(e){
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width/2;
    const y = rect.height/2 - (e.clientY - rect.top);
    // расстояние от центра круга
    const r = Math.sqrt(x*x + y*y);
    // если клик вне кольца или внутри чёрного круга — игнорируем
    if(r > rect.width/2 || r < rect.width*0.3){
      return;
    }
    //угол направления точки считаем как арктангенс (y/x)
    const angle = Math.atan2(y, x);
    let hue = 90 - angle * (180 / Math.PI);
    if(hue < 0) hue += 360;
    const rgb = this._hslToRgb(hue,100,50);
    const entity = this.config?.entity;
    if(this.hass?.states?.[entity]){
      this.hass.callService("light","turn_on",{
        entity_id:entity,
        rgb_color: rgb
      });
    }
  }

  _togglePower(){

    this.power = !this.power;

    const entity = this.config?.entity;
    this._expectedPower = this.power;
    if(this.hass?.states?.[entity]){
      this.hass.callService("light","toggle",{
        entity_id: entity
      });
    }

  }

  _setBrightness(percent){
    const entity = this.config?.entity;
    if(this.hass?.states?.[entity]){
      this.hass.callService("light","turn_on",{
        entity_id:entity,
        brightness_pct:percent,
      });
    }
  }

  _handleDrag(e){
      if(!this.power) return;
      const bar = e.currentTarget;
      const rect = bar.getBoundingClientRect();
      let percent = this.brightness;
      const move = (event)=>{
          this.dragging=true;
          const x = event.clientX - rect.left;
          percent = Math.round((x / rect.width) * 100);
          percent = Math.max(0, Math.min(100, percent));
          this.brightness = percent;
      };
      const stop = ()=>{
          this.dragging=false;
          this._lastUserChange = Date.now();
          this._setBrightness(percent);
          window.removeEventListener("mousemove",move);
          window.removeEventListener("mouseup",stop);
      };

      move(e);

      window.addEventListener("mousemove",move);
      window.addEventListener("mouseup",stop);
  }

  render(){
    
    return html`
      <div class="frame">
        <div class="header">
          <div
            class="icon ${this.power ? "iconActive" : ""}"
            @click=${this._togglePower}
          >
            <img width="24" src="/local/images/container-images/power_button.png"/>
          </div>
          <div>
            <div class="title">Светодиодная лента</div>
            <div class="subtitle">
              ${this.power ? "Включена" : "Выключена"}
            </div>
          </div>
        </div>

        <div class="section">
          <div class="row">
            <div>Яркость</div>
            <div class="value">${this.brightness}%</div>
          </div>
          <div
            class="bar ${!this.power ? "disabled" : ""}"
            @pointerdown=${this._handleDrag}
          >
            <div
              class="active"
              style="transform:scaleX(${Math.min((this.brightness / 100) + 0.05, 1)})"
            ></div>
            <div
              class="drag"
              style="left:${this.brightness}%"
            ></div>
          </div>
        </div>
        <div class="section">
          <div class="row">
            <div>Цвет</div>
          </div>
          <div class="color-section">
            <div
              class="color-wheel"
              @click=${this._pickColor}
            ></div>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("emelya-light-strip", EmelyaLightStrip);