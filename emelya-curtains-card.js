import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";

class EmelyaCurtainsCard extends LitElement {

  static properties = {
    hass: {},
    config: {},
    position: { type:Number }
  };
  

  constructor(){
    super();
    this.position = 0;
    this._holdInterval = null;
    this._holdTimeout = null;
    this.dragging = false;
    this._lastUserChange = 0;
  }

  setConfig(config){
    this.config = config || {};
  }

  set hass(hass){
    this._hass = hass;

    const entity = this.config?.entity;
    const stateObj = hass.states?.[entity];

    if(!stateObj) return;

    const pos = stateObj.attributes?.current_position;

    const now = Date.now();
    const ignoreUpdate = (now - this._lastUserChange) < 1000;

    if(!this.dragging && !ignoreUpdate && pos !== undefined){
      // фильтр от мелких скачков
      if(Math.abs(this.position - pos) > 1){
        this.position = pos;
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
      justify-content:flex-end;
      gap:24px;
      padding:16px;
      background: #1C1B1F;
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

    .percent{
      font-size:15px;
      opacity:0.5;
    }

    .controls{
      display:flex;
      gap:4px;
      height:56px;
    }

    button{
      border:none;
      cursor:pointer;
      background: #343239;
      display:flex;
      align-items:center;
      justify-content:center;
    }

    .wide{
      flex:1;
      border-radius:16px;
      position:relative;
    }

    .center{
      width:56px;
      border-radius:50%;
      background: #343239;
      display:flex;
      align-items:center;
      justify-content:center;
      cursor:pointer;
    }

    .center::after{
      content:"";
      width:12px;
      height:12px;
      background:white;
      border-radius:1px;
    }

    .arrow{
      position:absolute;
      top:50%;
      left:50%;
      width:6px;
      height:6px;
      border-right:3px solid white;
      border-bottom:3px solid white;
    }
    .down{
      transform:translate(-50%,-50%) rotate(45deg);
    }

    .up{      
      transform:translate(-50%,-25%) rotate(-135deg);
    }

  `;

  _startHold(action){

    this.dragging = true;

    this._holdTimeout = setTimeout(()=>{
      this._holdInterval = setInterval(()=>{
        action();
        this._lastUserChange = Date.now();
      },40);
    },300);

  }

  _stopHold(){

    clearTimeout(this._holdTimeout);
    clearInterval(this._holdInterval);

    this._holdTimeout = null;
    this._holdInterval = null;

    this.dragging = false;
    this._lastUserChange = Date.now();
  }

  _click(action){
    this.dragging = true;

    action();

    this.dragging = false;
    this._lastUserChange = Date.now();
  }

  _setPosition(value){

    value = Math.max(0, Math.min(100, value));

    this.position = value;
    this._lastUserChange = Date.now();

    const entity = this.config?.entity;
    if(!this.hass?.states?.[entity]) return;

    this.hass.callService("cover","set_cover_position",{
      entity_id:entity,
      position:value
    });
  }
  _openCover(){

    this.position = 100;
    this._lastUserChange = Date.now();
    const entity = this.config?.entity;

    if(!this.hass?.states?.[entity]) return;

    this.hass.callService("cover","open_cover",{
      entity_id:entity
    });

  }
  _closeCover(){

    this.position = 0;
    this._lastUserChange = Date.now();
    const entity = this.config?.entity;

    if(!this.hass?.states?.[entity]) return;

    this.hass.callService("cover","close_cover",{
      entity_id:entity
    });

  }
  _changeCover(){
    const entity = this.config?.entity;

    if (this.position !==100){
      this.position = 100;
      this._lastUserChange = Date.now();
      if(!this.hass?.states?.[entity]) return;
      this.hass.callService("cover","open_cover",{
      entity_id:entity
    });

    }else{
      this.position = 0;
      this._lastUserChange = Date.now();
      if(!this.hass?.states?.[entity]) return;
      this.hass.callService("cover","close_cover",{
        entity_id:entity
      });
    }

  }

  _change(delta){

    this._setPosition(this.position + delta);

  }

  render(){

    return html`

      <div class="card">

        <div class="header">
          <div class="title">Шторы</div>
          <div class="percent">${this.position}%</div>
        </div>

        <div class="controls">

          <button
            class="wide"
            @click=${()=>this._click(()=>this._change(-1))}
            @mousedown=${()=>this._startHold(()=>this._change(-1))}
            @mouseup=${this._stopHold}
            @mouseleave=${this._stopHold}
          >
            <div class="arrow down"></div>
          </button>

          <div
            class="center"
            @click=${this._changeCover}
          ></div>

          <button
            class="wide"
            @click=${()=>this._click(()=>this._change(1))}
            @mousedown=${()=>this._startHold(()=>this._change(1))}
            @mouseup=${this._stopHold}
            @mouseleave=${this._stopHold}
          >
            <div class="arrow up"></div>
          </button>

        </div>

      </div>

    `;
  }

}

customElements.define("emelya-curtains-card", EmelyaCurtainsCard);