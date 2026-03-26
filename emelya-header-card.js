// /config/www/emelya-header-card.js
import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";

class EmelyaHeaderCard extends LitElement {

  static properties = {
    hass: {},
    config: {},
  };
  constructor(){
    super();
    this._temp = 24;
    this._isOnline = true;
    this._mode = localStorage.getItem("home_mode") || "home";
    window.addEventListener("home-mode-changed", () => {
      const saved = localStorage.getItem("home_mode");
      if(saved){
        this._mode = saved;
        this.requestUpdate();
      }
    });
  }

  setConfig(config) {
    this.config = config;
    this.base = config.base_path || "/local";
    this._weatherIcon = `${this.base}/images/rain.png`;
  }
  set hass(hass){
    this._hass = hass;

    // PERSON (онлайн)
    const person = hass.states?.[this.config?.person_entity];

    if(person){
      this._isOnline = person.state === "home";
    }

    // WEATHER
    const weather = hass.states?.[this.config?.weather_entity];

    if(weather){

      const temp = weather.attributes?.temperature;
      this._temp = temp !== undefined ? Math.round(temp) : this._temp;

      const condition = weather.state;
      this._weatherIcon = this._mapWeather(condition);

    }
    // MODE FROM SCRIPTS
    const scripts = [
      { entity: "script.arrive_home", mode: "home" },
      { entity: "script.leave_home", mode: "away" },
      { entity: "script.night_mode", mode: "night" }
    ];

    let lastTime = 0;
    let newMode = null;

    scripts.forEach(s => {
      const obj = hass.states?.[s.entity];
      if(!obj) return;

      const t = new Date(obj.attributes?.last_triggered || 0).getTime();

      if(t > lastTime){
        lastTime = t;
        newMode = s.mode;
      }
    });

    // если нашли по HA - используем и сохраняем
    if(newMode){
      this._mode = newMode;
      localStorage.setItem("home_mode", newMode);
    } else {
      // fallback если HA не дал данных
      const saved = localStorage.getItem("home_mode");
      if(saved){
        this._mode = saved;
      }
    }
  }

  static styles = css`
    :host {
      display: block; 
    }

    .wrapper {
      height:120px;
      padding: 24px;
      gap: 32px;
      box-sizing: border-box;
      width:100%;
      display: flex;
      flex-direction: column;
      border-radius: 24px;
      background:
        linear-gradient(
          90deg,
          #1C1B1F 0%,
          rgba(28,27,31,0) 50%,
          #1C1B1F 100%
        ),
        var(--bg-image);  
      background-size: cover;
      background-position:center 75%;
    }

    .row {
      display: flex;
      justify-content: space-between;
      align-items: center; 
      height: 100%;
    }

    .left {
      display: flex;
      align-items: center;
      gap: 32px;
    }
    

    .avatar-wrapper {
      position: relative;
      width: 64px;
      height: 64px;
    }

    .avatar {
      text-align:start;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      object-fit: cover;
    }

    .online {
      position: absolute;
      bottom: 4px;
      right: 4px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #7FB800;
      border: 2px solid #1C1B1F;
    }

    .text-block {
      align-items:start;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .title {
      font-size: 32px;
      font-weight: 600;
      color: #FFFFFF;
    }

    .subtitle {
      padding: 0;
      margin: 0;
      font-size: 12px;
      color: rgba(255,255,255,0.8);
      text-align: left;
    }
    .right{
      display:flex;
      align-items: center;
      flex-direction:column;
    }
    .logo{
      width:96px;
      height:40px;
    }
    .weather {
      margin-top:10px;
      width:100%;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      color: white;
    }

    .temp {
      font-size: 16px;
      font-weight: 600;
    }
      @media(max-width:480px){
        .left{
            flex-direction:column-reverse;
            align-items: flex-start;
        }
        .wrapper {
          height:210px;
        }
        .weather{
          gap:8px;
          margin-top: 0; 
          width: 100%;
        }
        .weather * {
          margin: 0;
        }
        .logo{
          width:80px;
          height:33px;
        }
        .logo img {
          width: 100%; 
          height: 100%;
          object-fit: contain;
        }
        .right {
          justify-content: space-between;
          align-items: flex-end;
          height: 100%;
          margin: 0; 
          padding: 0; 
        }
        .temp, .rain {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 64px;
          height: 64px;
          background: #000000;
          border-radius: 50%;
          margin: 0; 
          padding: 0;
        }
    }
  `;
  _mapWeather(condition){

    const map = {
      rainy: `${this.base}/images/rain.png`,
      pouring: `${this.base}/images/rain.png`,
      cloudy: `${this.base}/images/cloud.svg`,
      sunny: `${this.base}/images/sun.svg`,
      clear: `${this.base}/images/sun.svg`,
      partlycloudy: `${this.base}/images/cloud.svg`
    };

    return map[condition] || `${this.base}/images/rain.png`;
  }
  _getModeText(){
    const map = {
      home: "Все устройства переведены в режим «Мы пришли»",
      away: "Все устройства переведены в режим «Никого нет дома»",
      night: "Все устройства переведены в режим «Ночной режим»"
    };

    return map[this._mode] || "";
  }

  render() {
    return html`
      <div class="wrapper" style="--bg-image: url('${this.base}/images/header-bg.png')">
        <div class="row">
          <div class="left">
            <div class="avatar-wrapper">
              <img class="avatar" src="${this.base}/images/person.png">
              ${this._isOnline ? html`<div class="online"></div>` : ""}
            </div>
            <div class="text-block">
              <div class="title">Дома</div>
              <div class="subtitle">
                ${this._getModeText()}
              </div>
            </div>
          </div>
          <div class=right>
            <div class="logo">
              <img src="${this.base}/images/emelya-title.png">
            </div>
            <div class="weather">
              <div class="temp">
                ${this._temp}°
              </div>
              <div class="rain">
                <img src="${this._weatherIcon}">
              </div>
            </div>
          <div>

        </div>
      </div>
    `;
  }

}

customElements.define("emelya-header-card", EmelyaHeaderCard);