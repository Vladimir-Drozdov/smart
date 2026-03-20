import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";

class EmelyaHumidifierCard extends LitElement {

  static properties = {
    hass: {},
    config: {},
    opened: { state: true },
    mode: { state: true },
    power: { state: true },
    modes: { state: true }
  };

  constructor(){
    super();
    this.opened = false;
    this.mode = "";
    this.modes = ["auto", "manual", "sleep"];
    this.power = false;
    this._expectedPower = null;
    this._expectedMode = null;
  }

  setConfig(config) {
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

    const modeEntity = this.config?.mode_entity;
    const modeObj = hass.states?.[modeEntity];

    if(modeObj){
      const newMode = modeObj.state;
      const options = modeObj.attributes?.options || [];
      this.modes = options.length
        ? options
        : (this.modes.length ? this.modes : [this.mode]);

      if(this._expectedMode !== null){
        if(newMode === this._expectedMode){
          this._expectedMode = null;
          this.mode = newMode;
        }
      } else {
        this.mode = newMode;
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
      height:320px;
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
      opacity:.6;
    }

    .controls{
      display:flex;
      gap:8px;
      height:56px;
    }

    .select{
      position:relative;
      flex:1;
    }

    .select-trigger{
      height:56px;
      border-radius:16px;
      padding:0 20px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      background:rgba(255,255,255,0.1);
      cursor:pointer;
      font-size:15px;
    }

    .arrow{
      width:8px;
      height:8px;
      border-right:2px solid white;
      border-bottom:2px solid white;
      transform:rotate(45deg);
      transition:transform .25s;
    }

    .select.open .arrow{
      transform:rotate(-135deg);
    }

    .dropdown{
      position:absolute;
      top:calc(100% + 6px);
      left:0;
      right:0;
      background:#2B2A2F;
      border-radius:16px;
      overflow:hidden;
      opacity:0;
      transform:translateY(-6px);
      pointer-events:none;
      transition:all .2s ease;
    }

    .select.open .dropdown{
      opacity:1;
      transform:translateY(0);
      pointer-events:auto;
    }

    .option{
      padding:14px 20px;
      cursor:pointer;
      transition:background .2s;
    }

    .option:hover{
      background:rgba(255,255,255,0.08);
    }

    .power{
      width:80px;
      display:flex;
      justify-content:center;
      align-items:center;
      border-radius:16px;
      background:rgba(255,255,255,0.1);
      cursor:pointer;
      transition:0.2s;
    }

    .power.active{
      background:#ff7a2f;
    }

    .power img{
      width:28px;
      height:28px;
    }

  `;

  _togglePower(){
    const entity = this.config?.entity;

    const newPower = !this.power;
    this.power = newPower;
    this._expectedPower = newPower;

    if(this.hass && entity){
      const domain = entity.split(".")[0];
      const service = newPower ? "turn_on" : "turn_off";

      this.hass.callService(domain, service, {
        entity_id: entity
      });
    }
  }

  _toggleDropdown(){
    this.opened = !this.opened;
  }

  _selectMode(value){
    this.mode = value;
    this._expectedMode = value;

    this.opened = false;

    const modeEntity = this.config?.mode_entity;

    if(this.hass && modeEntity){
      this.hass.callService("select","select_option",{
        entity_id: modeEntity,
        option: value
      });
    }
  }
  _modeLabel(value){

    const map = {
      auto: "Автоматически",
      manual: "Вручную",
      sleep: "Ночной"
    };

    return map[value] || value;
  }

  render(){
    const bg = `${this.base}/images/container-images/humidifier.png`;
    return html`

      <div
        class="card"
        style="
          background:
            linear-gradient(180deg, rgba(28,27,31,0) 75%, #1C1B1F 100%),
            url('${bg}') center/cover no-repeat,
            #1C1B1F;
        "
      >

        <div class="header">
          <div class="title">Увлажнитель</div>

          <div class="state">
            ${this.power
              ? (this.mode ? this._modeLabel(this.mode) : "Включено")
              : "Выключено"}
          </div>
        </div>

        <div class="controls">

          <div class="select ${this.opened ? "open" : ""}">

            <div
              class="select-trigger"
              @click=${this._toggleDropdown}
            >
              <span>${this._modeLabel(this.mode)}</span>
              <div class="arrow"></div>
            </div>

            <div class="dropdown">
              ${this.modes.map(option => html`
                <div
                  class="option"
                  @click=${() => this._selectMode(option)}
                >
                  ${this._modeLabel(option)}
                </div>
              `)}
            </div>
          </div>

          <div
            class="power ${this.power ? "active" : ""}"
            @click=${this._togglePower}
          >
            <img src="${this.base}/images/container-images/power_button.png">
          </div>
        </div>
      </div>

    `;
  }

}

customElements.define("emelya-humidifier-card", EmelyaHumidifierCard);

/*
type: custom:emelya-humidifier-card
entity: switch.humidifier
mode_entity: select.humidifier_mode
*/