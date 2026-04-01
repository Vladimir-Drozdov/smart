import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";

class EmelyaBreezerCard extends LitElement {

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
    this.selectedMode = "Комфорт";
    this.power = false;
    this.modes = [];
    this._expectedPower = null;
    this._expectedMode = null;
  }

  set hass(hass){
    this._hass = hass;

    const entity = this.config?.entity;
    const stateObj = hass.states?.[entity];

    // POWER
    if(stateObj){
      const newPower = stateObj.state === "on";

      if(this._expectedPower !== null){
        if(newPower !== this._expectedPower){
          return;
        }
        this._expectedPower = null;
      }

      this.power = newPower;
    }

    // MODE
    const modeEntity = this.config?.mode_entity;
    const modeState = hass.states?.[modeEntity];

    if(modeState){
      const option = modeState.state;
      const options = modeState.attributes?.options;

      if(this._expectedMode !== null){
        if(option !== this._expectedMode){
          return;
        }
        this._expectedMode = null;
      }

      if(option){
        this.selectedMode = option;
      }

      if(options){
        this.modes = options;
      }
    }
  }

  get hass(){
    return this._hass;
  }

  setConfig(config){
    this.config = config || {};
    this.base = config.base_path || "/local";

    if(!config.entity){
      console.warn("emelya-breezer-card: entity not specified");
    }
  }

  static styles = css`

    :host{
      display:block;
      max-width:321px;
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
      opacity:0.5;
    }

    .controls{
      display:flex;
      gap:8px;
      align-items:center;
    }

    .option.selected{
      background:#343239;
      font-weight:600;
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
      transition:0.2s;
    }

    .power.active{
      background: #E65332;
    }

    .power img{
      width:24px;
      height:24px;
    }

  `;

  _toggle(e){
    e.stopPropagation();
    this.power = !this.power;

    const entity = this.config?.entity;
    if(!this.hass?.states?.[entity]) return;

    this._expectedPower = this.power;

    const domain = entity.split(".")[0];
    const service = this.power ? "turn_on" : "turn_off";

    this.hass.callService(domain, service, {
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
    const modeState = this.hass?.states?.[this.config.mode_entity];
    return html`

      <ha-card class="card" @click=${this._handleCardClick}>

        <div class="header">
          <div class="title">Бризер</div>
          <div class="state">
            ${this.power ? "Работает" : "Выключено"}
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

          <div class="power ${this.power ? "active":""}" @click=${this._toggle}>
            <img src="${this.base}/images/container-images/power_button.png">
          </div>

        </div>

      </ha-card>
    `;
  }
}

customElements.define("emelya-breezer-card", EmelyaBreezerCard);

/*
type: custom:emelya-breezer-card
base_path: /local/emelya-cards-test
entity: switch.breezer
mode_entity: select.breezer_mode
*/