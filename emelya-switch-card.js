import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";

class EmelyaSwitchCard extends LitElement {

  static properties = {
    hass: {},
    config: {},
  };

  setConfig(config) {
    this.config = config;
  }

  static styles = css`
    :host {
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
      background:#1C1B1F;
      border-radius:24px;
      color:white;
      height:140px;
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
      justify-content:center;
      align-items:center;
      height:56px;
    }

    button{
      width:56px;
      height:56px;
      border-radius:50%;
      border:none;
      cursor:pointer;
      background:#343239;
      display:flex;
      align-items:center;
      justify-content:center;
      transition:0.2s;
    }

    button.active{
      background: #ff7a2f;
    }

    .square{
      width:12px;
      height:12px;
      background:white;
      border-radius:2px;
    }
  `;

  _toggle(){
    
    if(!this.config?.entity) return;

    const entity = this.hass.states[this.config.entity];
    console.log(entity);
    console.log(Object.keys(this.hass.states[this.config.entity].attributes))

    if(!entity) return;

    const domain = this.config.entity.split(".")[0];

    if(entity.state === "on"){
      this.hass.callService(domain,"turn_off",{entity_id:this.config.entity});
    } else {
      this.hass.callService(domain,"turn_on",{entity_id:this.config.entity});
    }

  }

  render(){

    const entity = this.hass?.states[this.config?.entity];
    const isOn = entity?.state === "on";

    return html`
      <div class="card">

        <div class="header">
          <div class="title">Переключатель</div>
          <div class="state">${isOn ? "Включено" : "Выключено"}</div>
        </div>

        <div class="controls">
          <button
            class="${isOn ? "active" : ""}"
            @click=${this._toggle}
          >
            <div class="square"></div>
          </button>
        </div>

      </div>
    `;
  }
}

customElements.define("emelya-switch-card", EmelyaSwitchCard);