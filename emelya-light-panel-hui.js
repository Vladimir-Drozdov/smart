class EmelyaLightPanelHui extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    this.cards = [];
    this._hass = null;
    this.power = false;

    const style = document.createElement("style");
    style.textContent = `
      ha-card {
        max-width: 320px;
        width: 100%;
        background: #1C1B1F;
        border-radius: 28px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px;
        box-sizing: border-box;
      }

      .header {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 0 16px 0 0;
        gap: 8px;
        width: 242px;
        height: 64px;
      }

      .power-button {
        width: 64px;
        height: 64px;
        background: #343239;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        position: relative;
        flex-shrink: 0;
      }

      .power-button img {
        position: absolute;
        width: 24px;
        height: 24px;
        left: calc(50% - 12px);
        top: calc(50% - 12px);
      }

      .header-text {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 0;
        gap: 4px;
        width: 154px;
        height: 44px;
      }

      .header-text .title {
        font-family: 'Roboto';
        font-style: normal;
        font-weight: 600;
        font-size: 16px;
        line-height: 20px;
        color: #FFFFFF;
      }

      .header-text .subtitle {
        font-family: 'Roboto';
        font-style: normal;
        font-weight: 400;
        font-size: 15px;
        line-height: 20px;
        color: rgba(255, 255, 255, 0.6);
      }

      .tile-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      hui-tile-card {
        width: 100%;
        --tile-bar-orientation: horizontal;
      }

      hui-tile-card.disabled {
        opacity: 0.4;
        pointer-events: none;
      }
    `;

    // ha-card wrapper
    this.haCard = document.createElement("ha-card");

    // HEADER
    this.header = document.createElement("div");
    this.header.className = "header";

    this.powerButton = document.createElement("div");
    this.powerButton.className = "power-button";
    this.powerButton.innerHTML = `<img src="/local/images/container-images/power_button.png" />`;
    this.powerButton.addEventListener("click", () => this.togglePower());

    this.headerText = document.createElement("div");
    this.headerText.className = "header-text";

    this.titleEl = document.createElement("div");
    this.titleEl.className = "title";
    this.titleEl.textContent = "Освещение";

    this.subtitleEl = document.createElement("div");
    this.subtitleEl.className = "subtitle";
    this.subtitleEl.textContent = "Мастер-выключатель";

    this.headerText.append(this.titleEl, this.subtitleEl);
    this.header.append(this.powerButton, this.headerText);

    // TILE CONTAINER
    this.tileContainer = document.createElement("div");
    this.tileContainer.className = "tile-container";

    // Собираем карточку
    this.haCard.append(this.header, this.tileContainer);
    this.shadowRoot.append(style, this.haCard);
  }

  setConfig(config) {
    this.config = config || { tiles: [] };

    // очищаем контейнер
    this.tileContainer.innerHTML = "";
    this.cards = [];

    this.config.tiles.forEach(tileConfig => {
      const tile = document.createElement("hui-tile-card");
      tile.setConfig(tileConfig);
      this.tileContainer.appendChild(tile);
      this.cards.push(tile);
    });

    this.updateTilesState();
  }

  set hass(hass) {
    this._hass = hass;
    this.cards.forEach(tile => {
      try {
        tile.hass = hass;
      } catch (e) {
        console.warn("Failed to set hass on tile:", tile, e);
      }
    });

    this.updateTilesState();
  }

  get hass() {
    return this._hass;
  }

  togglePower() {
    this.power = !this.power;
    this.updateTilesState();
  }

  updateTilesState() {
    this.cards.forEach(tile => {
      if (this.power) {
        tile.classList.remove("disabled");
      } else {
        tile.classList.add("disabled");
      }
    });

    this.powerButton.style.background = this.power ? "#E65332" : "#343239";
  }
}

customElements.define("emelya-light-panel-hui", EmelyaLightPanelHui);