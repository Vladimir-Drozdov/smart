import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";

class EmelyaWasherCard extends LitElement {

  static properties = {
    hass: {},
    config: {},
    open: { state: true },
    selectedMode: {},
    power: { type: Boolean },
    modes: { state: true }
  };

  constructor(){
    super(); 

    this.open = false;

    this.selectedMode = "Быстрая стирка";
    this.power = false;

    this._expectedPower = null;
    this._expectedMode = null;

    this.modes = [];
  }

  setConfig(config) {
    this.config = config;
    this.base = config.base_path || "/local";
  }

  set hass(hass){
    this._hass = hass;

    const entity = this.config?.entity;
    const stateObj = hass.states?.[entity];

    // POWER
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

    // MODE
    const modeEntity = this.config?.mode_entity;
    const modeState = hass.states?.[modeEntity];

    if(modeState){
      const newMode = modeState.state;
      const options = modeState.attributes?.options || [];

      this.modes = options;

      if(this._expectedMode !== null){
        if(newMode === this._expectedMode){
          this._expectedMode = null;
          this.selectedMode = newMode;
        }
      } else {
        this.selectedMode = newMode;
      }
    }
  }

  get hass(){
    return this._hass;
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
      height:316px;
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
      opacity:0.5;
    }

    .controls{
      display:flex;
      gap:8px;
      height:56px;
    }
    .power{
      width:80px;

      display:flex;
      justify-content:center;
      align-items:center;

      border-radius:16px;

      background:#343239;

      cursor:pointer;
      transition:0.2s;
    }

    .power.active{
      background:#e65332;
    }

    .power img{
      width:24px;
      height:24px;
    }

  `;

  _togglePower(e){
    e.stopPropagation();
    const entity = this.config?.entity;
    const newPower = !this.power;

    this.power = newPower;
    this._expectedPower = newPower;

    this.open = false;

    if(!this.hass || !entity) return;

    this.hass.callService("switch","toggle",{
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
    if(e.target.closest("ha-select")) return;
    const entity = this.config?.entity;
    if(!entity) return;
    this._fireMoreInfo(entity);
  }

  _handleSelectDblClick(e){
    e.stopPropagation();
    this._fireMoreInfo(this.config.mode_entity);
  }

  _handleSelectChange(e){
    e.stopPropagation();
    const value = e.target.value;
    this.selectedMode = value;
    this._expectedMode = value;

    const modeEntity = this.config?.mode_entity;
    if(!this.hass?.states?.[modeEntity]) return;
    this.hass.callService("select","select_option",{
      entity_id: modeEntity,
      option: value
    });
  }

  render(){
    const bg = `${this.base}/images/container-images/washing_machine.png`;
    const modeState = this.hass?.states?.[this.config.mode_entity];

    return html`
      <ha-card>
        <div
          class="card" @click=${this._handleCardClick}
          style="
            background:
              linear-gradient(180deg, rgba(28,27,31,0) 75%, #1C1B1F 100%),
              url('${bg}') center/cover no-repeat,
              #1C1B1F;
          "
        >

          <div class="header">
            <div class="title">Стиральная машина</div>
            <div class="state">
              ${this.power ? "Включено" : "Выключено"}
            </div>
          </div>

          <div class="controls">

            ${modeState ? html`
              <ha-select
                .label=${modeState.attributes.friendly_name}
                .value=${modeState.state}
                @dblclick=${this._handleSelectDblClick}
                @change=${this._handleSelectChange}
              >
                ${(modeState.attributes.options || []).map(opt => html`
                  <mwc-list-item .value=${opt}>${opt}</mwc-list-item>
                `)}
              </ha-select>
            ` : ""}

            <div
              class="power ${this.power ? "active" : ""}"
              @click=${this._togglePower}
            >
              <img src="${this.base}/images/container-images/power_button.png">
            </div>

          </div>

        </div>
      </ha-card>

    `;
  }
}

customElements.define("emelya-washer-card", EmelyaWasherCard);
/*
type: custom:emelya-washer-card
base_path: /local/emelya-cards-test
entity: switch.washer
mode_entity: select.washer_mode
*/