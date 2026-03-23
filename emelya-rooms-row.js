import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";

class EmelyaRoomsRow extends LitElement {

  static properties = {
    hass: {},
    config: {}
  };

  constructor() {
    super();
    this.isDragging = false;
    this.dragStarted = false;
    this.startX = 0;
    this.startScrollLeft = 0;
  }

  setConfig(config) {
    this.config = config || {};
  }

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .container {
      display: flex;
      flex-direction: row;
      gap: 8px;
      overflow-x: scroll;
      overflow-y: hidden;
      cursor: grab;
      scrollbar-width: none;
    }

    .container::-webkit-scrollbar {
      display: none;
    }

    .container.dragging {
      cursor: grabbing;
    }

    .card {
      width: 280px;
      min-width: 280px;
      height: 140px;

      border-radius: 24px;

      display: flex;
      justify-content: space-between;
      align-items: center;

      padding: 48px 28px 16px 16px;
      box-sizing: border-box;
      color: white;
    }

    .icon {
      width: 64px;
      height: 64px;
      background: rgba(255,255,255,0.1);
      border-radius: 20px;

      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon img {
      width: 32px;
      height: 32px;
      filter: brightness(0) invert(1);
    }

    .info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      padding-left: 8px;
    }

    .title {
      font-size: 16px;
      font-weight: 600;
    }

    .temp {
      font-size: 15px;
      color: rgba(255,255,255,0.6);
    }
  `;

  _onMouseDown(e) {

    const container = this.renderRoot.querySelector('.container');

    this.dragStarted = false;
    this.startX = e.pageX;
    this.startScrollLeft = container.scrollLeft;

    this._dragStartTime = Date.now();
    this._dragStartX = e.pageX;

    document.addEventListener("mousemove", this._onMouseMove);
    document.addEventListener("mouseup", this._onMouseUp);
  }

  _onMouseMove = (e) => {

    const container = this.renderRoot.querySelector('.container');
    if (!container) return;

    const moveX = Math.abs(e.pageX - this._dragStartX);
    const moveTime = Date.now() - this._dragStartTime;

    if (!this.dragStarted && (moveX > 5 || moveTime > 200)) {
      this.dragStarted = true;
      container.classList.add("dragging");
    }

    if (this.dragStarted) {
      e.preventDefault();

      const walk = (e.pageX - this.startX) * 1.5;
      container.scrollLeft = this.startScrollLeft - walk;
    }
  };

  _onMouseUp = () => {

    const container = this.renderRoot.querySelector('.container');

    if (container) {
      container.classList.remove("dragging");
    }

    document.removeEventListener("mousemove", this._onMouseMove);
    document.removeEventListener("mouseup", this._onMouseUp);

    this._dragStartTime = null;
    this.dragStarted = false;
  }; 
  _onRoomClick(room) {
    if (!room.tap_action || !this.hass) return;

    const tap = room.tap_action;

    if (tap.action === "call-service") {
      const [domain, service] = tap.service.split(".");
      this.hass.callService(domain, service, tap.data);
    }
  }

  render() {

    if (!this.config) return html``;

    const rooms = this.config.rooms || [];

    return html`
      <div
        class="container"
        @mousedown=${this._onMouseDown}
      >

        ${rooms.map(room => {

          const temp = room.entity
            ? this.hass?.states[room.entity]?.state
            : null;

          return html`
            <div
              class="card"
              style="
                background:
                radial-gradient(
                  179.4% 100% at 50% 0%,
                  rgba(28,27,31,0) 0%,
                  #1C1B1F 100%
                ),
                url(${room.background}) center / cover no-repeat
              "
              @click=${() => this._onRoomClick(room)}
            >

              <div class="icon">
                <img src="${room.icon}">
              </div>

              <div class="info">
                <div class="title">${room.name}</div>
                <div class="temp">
                  ${temp ?? "--"} °C
                </div>
              </div>

            </div>
          `;
        })}

      </div>
    `;
  }

}

customElements.define("emelya-rooms-row", EmelyaRoomsRow);