class DualThermostatCard extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    this.active = 0;

    const style = document.createElement("style");
    style.textContent = `
      .card {
        width: 288px;
        height: 424px;
        background: #1C1B1F;
        border-radius: 28px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .content {
        display: flex;
        flex-direction: column;
        flex: 1;
      }

      .buttons {
        display: flex;
        justify-content: center;
        gap: 12px;
        padding: 12px 16px 16px;
        background: #1C1B1F;
      }

      .btn {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #343239;
        border: 1px solid rgba(101, 101, 101, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }

      .btn img {
        width: 24px;
        height: 24px;
      }

      /* TOGGLE контейнер */
      .toggle {
        position: relative;
        display: flex;
        align-items: center;

        padding: 4px;
        width: 120px;
        height: 64px;

        background: #1C1B1F;
        border: 1px solid rgba(101, 101, 101, 1);
        border-radius: 96px;

        box-sizing: border-box;
      }

      /* ПЛАВНЫЙ СЛАЙДЕР */
      .slider {
        position: absolute;
        top: 3px;
        left: 3px;

        width: 56px;
        height: 56px;

        border-radius: 96px;
        background: #343239;

        transition: transform 0.25s ease;
      }

      /* положение (режим cool) */
      .slider.cool {
        transform: translateX(56px);
      }

      /* кнопки (иконки) */
      .toggle-btn {
        width: 56px;
        height: 56px;

        display: flex;
        align-items: center;
        justify-content: center;

        border-radius: 50%;
        cursor: pointer;
        z-index: 1;
      }

      /* активная кнопка */
      .toggle-btn.active {}

      /* иконка */
      .toggle-btn img {
        width: 24px;
        height: 24px;
      }
    `;

    //  STATIC DOM
    this.card = document.createElement("div");
    this.card.className = "card";

    this.content = document.createElement("div");
    this.content.className = "content";

    this.thermoContainer = document.createElement("div");

    this.buttons = document.createElement("div");
    this.buttons.className = "buttons";

    this.content.append(this.thermoContainer, this.buttons);
    this.card.appendChild(this.content);

    this.shadowRoot.append(style, this.card);
  }

  setConfig(config) {
    this.config = config;

    this.card1 = document.createElement("hui-thermostat-card");
    this.card1.setConfig({
      entity: config.entity1,
      name: config.name1,
      card_mod: config.card_mod
    });

    this.card2 = document.createElement("hui-thermostat-card");
    this.card2.setConfig({
      entity: config.entity2,
      name: config.name2,
      card_mod: config.card_mod
    });

    this.buildButtons();
  }

  set hass(hass) {
    this._hass = hass;

    if (this.card1) this.card1.hass = hass;
    if (this.card2) this.card2.hass = hass;

    this.updateUI();
  }

  // UI сборка (один раз) 
  buildButtons() {
    this.buttons.innerHTML = "";

    // POWER
    this.powerBtn = document.createElement("div");
    this.powerBtn.className = "btn";
    this.powerBtn.innerHTML = `<img src="${this.config.power_icon}" />`;
    this.powerBtn.onclick = () => this.togglePower();

    // TOGGLE
    this.toggle = document.createElement("div");
    this.toggle.className = "toggle";

    this.slider = document.createElement("div");
    this.slider.className = "slider";

    this.heatBtn = document.createElement("div");
    this.heatBtn.className = "toggle-btn";
    this.heatBtn.innerHTML = `<img src="${this.config.heat_icon}" />`;
    this.heatBtn.onclick = () => this.setMode(0);

    this.coolBtn = document.createElement("div");
    this.coolBtn.className = "toggle-btn";
    this.coolBtn.innerHTML = `<img src="${this.config.cool_icon}" />`;
    this.coolBtn.onclick = () => this.setMode(1);

    this.toggle.append(this.slider, this.heatBtn, this.coolBtn);
    this.buttons.append(this.powerBtn, this.toggle);
  }

  // только обновления
  updateUI() {
    this.updateThermostat();
    this.updatePower();
    this.updateToggle();
  }

  updateThermostat() {
    const thermo = this.active === 0 ? this.card1 : this.card2;

    if (!this.thermoContainer.contains(thermo)) {
      this.thermoContainer.innerHTML = "";
      this.thermoContainer.appendChild(thermo);
    }
  }

  updatePower() {
    if (!this._hass) return;

    const isOn =
      this._hass.states[this.config.entity1].state !== "off";

    this.powerBtn.style.background = isOn ? "#E65332" : "#343239";
  }

  updateToggle() {
    this.slider.classList.toggle("cool", this.active === 1);
    this.heatBtn.classList.toggle("active", this.active === 0);
    this.coolBtn.classList.toggle("active", this.active === 1);
  }

  // --- actions ---
  setMode(index) {
    if (this.active === index) return;

    this.active = index;
    this.updateUI();
  }

  togglePower() {
    const isOff =
      this._hass.states[this.config.entity1].state === "off";

    this._hass.callService("climate", isOff ? "turn_on" : "turn_off", {
      entity_id: [this.config.entity1, this.config.entity2]
    });
  }
}

customElements.define("dual-thermostat-card", DualThermostatCard);