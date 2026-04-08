import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";

const LEVEL_MAP = {1:33, 2:66, 3:100};

/* ===============================
   1️⃣ Основная карточка
=============================== */
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
    if(percentage === 0) newLevel = 0;
    else if(percentage <= 33) newLevel = 1;
    else if(percentage <= 67) newLevel = 2;
    else newLevel = 3;

    if(this._expectedLevel !== null){
      if(newLevel === this._expectedLevel){
        this._expectedLevel = null;
        this.level = newLevel;
      }
    } else {
      this.level = newLevel;
    }
  }

  get hass(){ return this._hass; }

  setConfig(config){
    this.config = config || {};
    this.base = this.config.base_path || "/local";
  }

  static styles = css`
    :host { display:block; max-width:320px; width:100%; font-family:Roboto; color:white; }
    .frame { display:flex; flex-direction:column; justify-content:space-between; padding:16px; height:264px; border-radius:24px; }
    .title { font-weight:600; font-size:16px; }
    .controls { display:flex; gap:8px; height:56px; }
    .btn { flex:1; display:flex; justify-content:center; align-items:center; height:48px; border-radius:12px; cursor:pointer; }
    .btn:hover { background:#343239; }
    .btn.active { background:#343239; }
    .btn.power.active { background:#E65332; }
    .circle { border:2px solid white; border-radius:50%; opacity:0.25; }
    .circle.small{ width:10px; height:10px; }
    .circle.medium{ width:14px; height:14px; }
    .circle.big{ width:18px; height:18px; }
    .enabled .circle { opacity:0.8; }
    .btn.active .circle { opacity:1; border-color:#E65332; }
  `;

  _togglePower(e){
    e.stopPropagation();

    const entity = this.config?.entity;
    const newPower = !this.power;

    this.power = newPower;
    this._expectedPower = newPower;

    if(!newPower){
      this.level = 0;
      this._expectedLevel = null;
    }

    if(!this.hass || !entity) return;

    this.hass.callService("fan", newPower ? "turn_on" : "turn_off", {
      entity_id: entity
    });
  }

  _handleCardClick(e){
    if(e.target.closest(".btn")) return;

    const entity = this.config?.entity;
    if(!entity) return;

    this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId: entity },
      bubbles: true,
      composed: true
    }));
  }

  _setLevel(level){
    this.level = level;

    if(!this.power){
      this._expectedLevel = null;
      return;
    }

    this._expectedLevel = level;

    const entity = this.config?.entity;
    if(!this.hass || !entity) return;

    this.hass.callService("fan","set_percentage",{
      entity_id: entity,
      percentage: LEVEL_MAP[level]
    });
  }

  render(){
    const bg = `${this.base}/images/container-images/kitchen-hood.png`;

    return html`
      <div class="frame"
        @click=${this._handleCardClick}
        style="background:url('${bg}'), #1C1B1F; background-size:cover;">

        <div class="title">Вытяжка</div>

        <div class="controls ${this.power ? "enabled":""}">
          <div class="btn power ${this.power ? "active":""}" @click=${this._togglePower}>
            ⏻
          </div>

          <div class="btn ${this.level===1?"active":""}" @click=${()=>this._setLevel(1)}>
            <div class="circle small"></div>
          </div>

          <div class="btn ${this.level===2?"active":""}" @click=${()=>this._setLevel(2)}>
            <div class="circle medium"></div>
          </div>

          <div class="btn ${this.level===3?"active":""}" @click=${()=>this._setLevel(3)}>
            <div class="circle big"></div>
          </div>
        </div>

      </div>
    `;
  }
}

/* ===============================
   2️⃣ Editor
=============================== */
class EmelyaHoodCardEditor extends LitElement {
  static properties = {
    hass: {},
    _config: {},
    _tab: {}
  };

  constructor(){
    super();
    this._tab = 0;
  }

  setConfig(config){
    this._config = { ...config };
  }

  render(){
    if(!this._config) return html``;

    return html`
      <div>

        <div style="display:flex; gap:8px; margin-bottom:12px;">
          ${["Объект","Содержимое","Взаимодействия","Функции"].map((t,i)=>html`
            <button
              @click=${()=>this._tab=i}
              style="padding:6px 10px; ${this._tab===i?"background:#03a9f4;color:#fff;":""}">
              ${t}
            </button>
          `)}
        </div>

        ${this._tab===0 ? this._objectTab() : ""}
        ${this._tab===1 ? this._contentTab() : ""}
        ${this._tab===2 ? this._actionsTab() : ""}
        ${this._tab===3 ? this._functionsTab() : ""}

      </div>
    `;
  }

  _objectTab(){
    return this._form([
      { name:"entity", required:true, selector:{ entity:{domain:"fan"} } }
    ]);
  }

  _contentTab(){
    return this._form([
      { name:"show_title", selector:{ boolean:{} } },
      { name:"base_path", selector:{ text:{} } }
    ]);
  }

  _actionsTab(){
    return this._form([
      { name:"tap_action", selector:{ action:{} } },
      { name:"hold_action", selector:{ action:{} } }
    ]);
  }

  _functionsTab(){
    return this._form([
      { name:"custom_functions", selector:{ text:{} } }
    ]);
  }

  _form(schema){
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${schema}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  _valueChanged = (e) => {
    this._config = e.detail.value;

    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    }));
  };
}

customElements.define("emelya-hood-card-editor", EmelyaHoodCardEditor);

/* ===============================
   3️⃣ Регистрация
=============================== */
EmelyaHoodCard.getConfigElement = function () {
  return document.createElement("emelya-hood-card-editor");
};

EmelyaHoodCard.getStubConfig = function () {
  return {
    entity: "",
    base_path: "/local",
    show_title: true
  };
};

customElements.define("emelya-hood-card", EmelyaHoodCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "custom:emelya-hood-card",
  name: "Emelya Hood Card",
  description: "Управление кухонной вытяжкой",
  preview: false
});




/* =================*/

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
    console.log("setter called")
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

    if (percentage === 0) {
      newLevel = 0;
    } else if (percentage <= 33) {
      newLevel = 1;
    } else if (percentage <= 67) {
      newLevel = 2;
    } else {
      newLevel = 3;
    }
    console.log("percentage: ", percentage, "newLevel: ", newLevel, "this._expectedLevel: ", this._expectedLevel);
    if(this._expectedLevel !== null){
      if(newLevel === this._expectedLevel){
        this._expectedLevel = null;
        this.level = newLevel;
      }
    } else {
      this.level = newLevel;
    }
  }
  get hass(){
    return this._hass;
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
      this._expectedLevel = null;
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

    if(!this.power){
      this._expectedLevel = null;
      return;
    }

    this._expectedLevel = level;

    const entity = this.config?.entity;
    if(!this.hass || !entity) return;

    this.hass.callService("fan","set_percentage",{
      entity_id:entity,
      percentage: LEVEL_MAP[level]
    });
  }

  render(){
  const bg = `${this.base}/images/container-images/kitchen-hood.png`;

  if (!this.hass || !this.config) return html``;

  return html`
    <ha-card style="padding:0; overflow:hidden; position:relative;">

      <!-- НАТИВНАЯ КАРТОЧКА (скрытая, но даёт editor) -->
      <hui-entity-card
        style="display:none"
        .hass=${this.hass}
        .config=${{
          entity: this.config.entity,
          name: "Вытяжка"
        }}
      ></hui-entity-card>

      <div
        class="frame"
        @click=${this._handleCardClick}
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

    </ha-card>
  `;
  }

}

customElements.define("emelya-hood-card", EmelyaHoodCard);