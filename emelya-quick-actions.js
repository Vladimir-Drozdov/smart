import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";

class EmelyaQuickActions extends LitElement {

  static properties = {
    hass: {},
    config: {},
    activeActions: { type: Object, state: true }
  };

  constructor() {
    super();
    this.activeActions = new Set();
    this.isDragging = false;
    this.startX = 0;
    this.scrollLeft = 0;
    this.dragStarted = false; // Флаг для отличия драга от клика
    this._expectedStates = {};
    this._lastUserChange = 0;

  }

  setConfig(config) {
    this.config = config;
  }
  set hass(hass){
    this._hass = hass;

    const actions = this.config?.actions || [];
    const newActive = new Set();

    const now = Date.now();
    const ignore = (now - this._lastUserChange) < 1000;

    actions.forEach((action, index) => {

      if(action.divider || !action.entity) return;

      const stateObj = hass.states?.[action.entity];
      if(!stateObj) return;

      const isOn = stateObj.state === "on" || stateObj.state === "home";

      const expected = this._expectedStates[index];

      if(expected !== undefined){
        if(isOn !== expected) return;
        delete this._expectedStates[index];
      }

      if(isOn){
        newActive.add(index);
      }
    });
    const hasAnyEntity = actions.some(action => {
      if (action.divider || !action.entity) return false;
      return !!hass.states?.[action.entity];
    });

    if (!hasAnyEntity) {
      return;
    }

    if(!ignore){
      this.activeActions = newActive;
    }
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .quick-actions {
      display: flex;
      flex-direction:row;
      flex-wrap:nowrap;
      gap: 8px;
      width: 100%;
      height: 100%;
      align-items: start;
      overflow-x: auto;
      overflow-y: hidden;
      scroll-behavior: auto;
      cursor: grab;
      user-select: none;
      -webkit-user-select: none;
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    .quick-actions::-webkit-scrollbar {
      display: none;
    }

    .quick-actions.dragging {
      cursor: grabbing;
      scroll-behavior: auto;
    }

    .action-btn {
      position: relative;
      background: #1C1B1F;
      border-radius: 24px;
      border: none;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0;
      transition: all 0.2s ease;
      height: 168px;
      flex-basis:auto;
      flex-shrink:1;
      flex-grow:1;
      min-width:106px;
      max-width:160px;
      pointer-events: auto;
      background-image:
        linear-gradient(#1C1B1F, #1C1B1F),
        linear-gradient(135deg, rgba(101, 101, 101, 0.0) 0%, #656565 50%, rgba(101, 101, 101, 0.0) 100%);
      border: 1px solid transparent;
      border-width: 1px;
      border-style: solid;
      background-origin: border-box, border-box;
      background-clip: padding-box, border-box;
    }

    .quick-actions.dragging .action-btn {
      pointer-events: none;
      transition: none;
    }

    .action-btn.active {
      background: #343239;
    }

    .icon-bg {
      position: absolute;
      height: 64px;
      left: 8px;
      right: 7.57px;
      top: 8px;
      border: 1px solid;

      border: 1px solid transparent;
      border-radius: 20px;
      background-image: 
        linear-gradient(#1C1B1F, #1C1B1F),
        linear-gradient(135deg, rgba(101, 101, 101, 0.0) 0%, #656565 50%, rgba(101, 101, 101, 0.0) 100%);
      border-width: 1px;
      border-style: solid;
      background-origin: border-box, border-box;
      background-clip: padding-box, border-box;

      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon img {
      width: 24px;
      height: 24px;
      filter: brightness(0) invert(1);
      object-fit: contain;
    }

    .icon ha-icon {
      color: white;
      width: 32px;
      height: 32px;
      --mdc-icon-size: 32px;
    }

    .label {
      position: absolute;
      left: 4px;
      right: 3.57px;
      bottom: 24px;
      font-family: 'Roboto', sans-serif;
      font-weight: 400;
      font-size: 12px;
      line-height: 16px;
      text-align: center;
      color: #FFFFFF;
      white-space: pre-line;
      margin: 0;
    }

    .label.single-line {
      bottom: 40px;
    }

    .divider {
      width: 3px;
      min-width: 3px;
      max-width: 3px;
      height: 120px;
      background: #343239;
      border-radius: 8px;
      align-self: center;
      pointer-events: none;
    }
  `;

  _onMouseDown(e) {
    // Запоминаем начальную позицию
    this.isDragging = false;
    this.dragStarted = false;
    this.startX = e.pageX - this.offsetLeft;
    this.scrollLeft = this.scrollLeft;
    
    const container = this.renderRoot.querySelector('.quick-actions');
    this.startScrollLeft = container.scrollLeft;
    
    // Устанавливаем флаг, что начали потенциальный драг
    this._dragStartTime = Date.now();
    this._dragStartX = e.pageX;
    
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mouseup', this._onMouseUp);
  }

  _onMouseMove = (e) => {
    if (!this._dragStartTime) return;
    
    const container = this.renderRoot.querySelector('.quick-actions');
    if (!container) return;
    
    // Проверяем, действительно ли пользователь двигает мышь
    const moveX = Math.abs(e.pageX - this._dragStartX);
    const moveTime = Date.now() - this._dragStartTime;
    
    // Если движение больше 5px или прошло больше 200ms - считаем это драгом
    if (!this.dragStarted && (moveX > 5 || moveTime > 200)) {
      this.dragStarted = true;
      container.classList.add('dragging');
    }
    
    if (this.dragStarted) {
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - this.startX) * 1.5; // Скорость прокрутки
      container.scrollLeft = this.startScrollLeft - walk;
    }
  }

  _onMouseUp = (e) => {
    const container = this.renderRoot.querySelector('.quick-actions');
    if (container) {
      container.classList.remove('dragging');
    }
    
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);
    
    // Если это был драг, не даем клику сработать
    if (this.dragStarted) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    this._dragStartTime = null;
    this.dragStarted = false;
  }

  _handleClick(action, index, e){ 

    if (this.dragStarted) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // LOCAL MODE SAVE 
    if(index === 0) localStorage.setItem("home_mode", "home");
    if(index === 1) localStorage.setItem("home_mode", "away");
    if(index === 2) localStorage.setItem("home_mode", "night");

    window.dispatchEvent(new Event("home-mode-changed"));

    if (!action) return;

    const actions = this.config.actions || [];
    const newActive = new Set(this.activeActions);

    let groupStart = 0;
    let groupEnd = actions.length;

    for (let i = index - 1; i >= 0; i--) {
      if (actions[i].divider) {
        groupStart = i + 1;
        break;
      }
    }

    for (let i = index + 1; i < actions.length; i++) {
      if (actions[i].divider) {
        groupEnd = i;
        break;
      }
    }

    const isActive = newActive.has(index);
    const newState = !isActive;

    if (newState) {
      for (let i = groupStart; i < groupEnd; i++) {
        newActive.delete(i);
      }
      newActive.add(index);
    } else {
      newActive.delete(index);
    }

    this.activeActions = newActive;

    if (action.entity && this.hass?.states?.[action.entity]) {

      this._expectedStates[index] = newState;
      this._lastUserChange = Date.now();

      const domain = action.service?.domain;
      const service = newState ? "turn_on" : "turn_off";

      this.hass.callService(domain, service, {
        entity_id: action.entity
      });
    }

  }

  render() {
    const actions = this.config.actions || [];

    return html`
      <div 
        class="quick-actions"
        @mousedown=${this._onMouseDown}
      >
        ${actions.map((action, index) => {

          if (action.divider) {
            return html`<div class="divider"></div>`;
          }

          const isActive = this.activeActions.has(index);
          const labelClass = action.lines === 1 ? 'label single-line' : 'label';

          return html`
            <button
              class="action-btn ${isActive ? 'active' : ''}"
              @click=${(e) => this._handleClick(action, index, e)}
            >
              <div class="icon-bg">
                <div class="icon">
                  ${action.icon
                    ? html`<img src="${action.icon}"/>`
                    : ""
                  }
                </div>
              </div>
              <span class="${labelClass}">${action.label}</span>
            </button>
          `;
        })}
      </div>
    `;
  }
}

customElements.define("emelya-quick-actions", EmelyaQuickActions);