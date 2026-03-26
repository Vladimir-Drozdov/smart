import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";

class EmelyaLightPanel extends LitElement {

  static properties = {
    hass: {},
    config: {},
    power: { type: Boolean }
  };

  constructor() {
    super();
    this.power = false;
    this.localBrightness = {};

    this._lastUserChange = 0;
    this._expectedPower = null;
    this._expectedBrightness = {};
    this.dragging = {};
    this.config = { lights: [] };
  }

  setConfig(config) {
    this.base = config.base_path || "/local";
    if (!config || !config.lights) {
      this.config = { lights: [] };
      return;
    }

    this.config = {
      ...config,
      lights: config.lights || []
    };

    this.config.lights.forEach(light => {
      if (this.localBrightness[light.entity] === undefined) {
        this.localBrightness[light.entity] = 50;
      }
    });
  }

  set hass(hass){
    this._hass = hass;
    if (!this.config?.lights) return;
    const now = Date.now();
    const ignoreUpdate = (now - this._lastUserChange) < 1000;
    let anyLightOn = false;

    this.config.lights.forEach(light => {

      const state = hass.states?.[light.entity];
      if (!state) return;

      const newPower = state.state === "on";
      if (newPower) anyLightOn = true;

      const bri = state.attributes?.brightness;

      if (bri !== undefined) {
        const percent = Math.round((bri / 255) * 100);

        const expected = this._expectedBrightness[light.entity];

        if (expected !== undefined) {

          if (Math.abs(percent - expected) > 1) {
            return;
          }

          delete this._expectedBrightness[light.entity];
        } else if (!ignoreUpdate && !this.dragging[light.entity]) {
          this.localBrightness = {
            ...this.localBrightness,
            [light.entity]: percent
          };
        }
      }

    });
    if (this._expectedPower !== null) {
      if (anyLightOn !== this._expectedPower) return;
      this._expectedPower = null;
    }
    if (!this.config.lights.some(l => hass.states?.[l.entity])) {
      return;
    }

    this.power = anyLightOn;
  }

  get hass() {
    return this._hass;
  }

  static styles = css`
    :host {
      display: block;
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

    .header {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .icon-box {
      width: 64px;
      height: 64px;
      background: #343239;
      border-radius: 16px;
      display:flex;
      align-items:center;
      justify-content:center;
      cursor:pointer;
      transition:0.2s;
    }

    .icon-box.iconActive{
      background:#E65332;
    }

    .title-block{
      display:flex;
      flex-direction:column;
      gap:4px;
    }

    .title{
      font-size:16px;
      font-weight:600;
    }

    .subtitle{
      font-size:15px;
      opacity:.6;
    }

    .section{
      display:flex;
      flex-direction:column;
      gap:8px;
    }

    .row{
      display:flex;
      justify-content:space-between;
      font-weight:600;
      font-size:16px;
    }

    .value{
      opacity:.5;
      font-weight:400;
      font-size:15px;
    }

    .state-bar{
      position:relative;
      width:100%;
      height:64px;
      border-radius:16px;
      border:1px solid white;
      cursor:pointer;
      overflow:hidden;
    }

    .state-bar.disabled{
      opacity:0.4;
      cursor:default;
    }

    .active{
      position:absolute;
      height:100%;
      width:100%;
      left:0;
      top:0;
      background:#343239;
      border-radius: 16px;
      transform-origin:left center;
    }

    .drag{
      position:absolute;
      width:6px;
      height:32px;
      top:50%;
      transform:translate(-50%,-50%);
      background:white;
      border-radius:24px;
      pointer-events:none;
    }
  `;

  _togglePower(){
    const newPower = !this.power;
    this.power = newPower;

    const hasDevice = this.config.lights.some(
      l => this.hass?.states?.[l.entity]
    );

    if (hasDevice) {
      this._expectedPower = newPower;
    }

    if (!this.config?.lights?.length) return;

    this.config.lights.forEach(light => {
      if (!this.hass?.states?.[light.entity]) return;

      this.hass.callService("light", newPower ? "turn_on" : "turn_off", {
        entity_id: light.entity
      });
    });
  }

  _setBrightness(entity, percent){

    this.localBrightness = {
      ...this.localBrightness,
      [entity]: percent
    };

  }

  _sendBrightness(entity, percent){

    if (!this.hass?.states?.[entity]) return;

    this.hass.callService("light","turn_on",{
      entity_id:entity,
      brightness_pct:percent
    });
  }

  _handleDrag(e, entity){
    if (!this.power) return;

    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    let percent = this.localBrightness[entity] ?? 0;

    const move = (event)=>{
      this.dragging[entity] = true;

      const x = event.clientX - rect.left;

      percent = Math.round((x / rect.width) * 100);
      percent = Math.max(0, Math.min(100, percent));

      this.localBrightness = {
        ...this.localBrightness,
        [entity]: percent
      };
      this.requestUpdate();
    };

    const stop = ()=>{
      this.dragging[entity] = false;
      this._lastUserChange = Date.now();

      if (this.hass?.states?.[entity]) {
        this._expectedBrightness[entity] = percent;
        this._sendBrightness(entity, percent);
      }

      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };

    move(e);

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  render(){

    const lights = this.config?.lights || [];

    if (!lights.length) {
      return html`
        <div class="frame">
          <div class="title">Нет настроенных ламп</div>
        </div>
      `;
    }

    return html`

      <div class="frame">

        <div class="header">

          <div
            class="icon-box ${this.power ? "iconActive" : ""}"
            @click=${this._togglePower}
          >
            <img width="24" src="${this.base}/images/container-images/power_button.png">
          </div>

          <div class="title-block">
            <div class="title">Освещение</div>
            <div class="subtitle">Мастер-выключатель</div>
          </div>

        </div>

        ${lights.map(light=>{

          const percent = this.localBrightness[light.entity] ?? 0;

          return html`

            <div class="section">

              <div class="row">
                <div>${light.name ?? light.entity}</div>
                <div class="value">${percent}%</div>
              </div>

              <div
                class="state-bar ${!this.power ? "disabled" : ""}"
                @pointerdown=${this.power ? (e)=>this._handleDrag(e, light.entity) : null}
              >

                <div
                  class="active"
                  style="transform:scaleX(${Math.min((percent/100)+0.05,1)})"
                ></div>

                <div
                  class="drag"
                  style="left:${percent}%"
                ></div>

              </div>

            </div>

          `;
        })}

      </div>
    `;
  }
}

customElements.define("emelya-light-panel", EmelyaLightPanel);