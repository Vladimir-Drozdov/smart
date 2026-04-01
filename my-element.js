export class MyElement extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this._cards = [];
    this._config = null;
    this._renderToken = 0;
    this._container = null;
  }

  setConfig(config) {
    if (!config || !Array.isArray(config.cards)) {
      throw new Error("Config.cards is required and must be an array");
    }

    this._config = config;
    this._ensureStructure();
    this._renderCards();
  }

  set hass(hass) {
    this._hass = hass;

    if (this._cards?.length) {
      this._cards.forEach((card, index) => {
        try {
          card.hass = hass;
        } catch (e) {
          console.error(`[my-element] failed to set hass on child #${index}:`, card, e);
        }
      });
    }
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    this._ensureStructure();

    if (this._config && !this._cards.length) {
      this._renderCards();
    }
  }

  getCardSize() {
    return this._cards?.reduce((sum, card) => {
      try {
        return sum + (card.getCardSize?.() || 1);
      } catch (e) {
        console.error("[my-element] getCardSize failed for", card, e);
        return sum + 1;
      }
    }, 0) || 1;
  }

  _ensureStructure() {
    if (this._container) return;

    this.style.display = "block";
    this.innerHTML = `
      <style>
        my-element {
          display: block;
        }

        .wrapper {
          display: flex;
          justify-content: flex-start;
          container-type: inline-size;
        }

        .container {
          column-width: 320px;
          column-gap: 8px;
          column-count: 3;
          width: 976px;
        }

        @container (max-width: 1000px) {
          .container {
            column-count: 2;
            width: 648px;
          }
        }

        @container (max-width: 670px) {
          .container {
            column-count: 1;
            width: 320px;
          }
        }

        .container > * {
          display: block;
          width: 100%;
          margin-bottom: 8px;
          break-inside: avoid-column;
          box-sizing: border-box;
        }
      </style>
      <div class="wrapper">
        <div class="container" id="container"></div>
      </div>
    `;

    this._container = this.querySelector("#container");
  }

  async _renderCards() {
    if (!this._config?.cards?.length) return;
    if (!this._container) this._ensureStructure();

    const token = ++this._renderToken;
    this._cards = [];
    this._container.innerHTML = "";

    let helpers;
    try {
      helpers = await window.loadCardHelpers();
    } catch (e) {
      console.error("[my-element] loadCardHelpers failed", e);
      this._container.appendChild(this._makeErrorBox("loadCardHelpers() failed", e));
      return;
    }

    for (let i = 0; i < this._config.cards.length; i++) {
      if (token !== this._renderToken) {
        return;
      }

      const cardConfig = this._config.cards[i];

      try {
        const card = helpers.createCardElement(cardConfig);

        if (!card) {
          throw new Error("createCardElement returned null/undefined");
        }

        if (card.localName) {
          try {
            await customElements.whenDefined(card.localName);
          } catch (e) {
            console.error("[my-element] whenDefined failed:", card.localName, e);
          }
        }

        card.style.display = "block";
        card.style.width = "100%";
        card.dataset.index = String(i);
        card.dataset.type = cardConfig?.type || "unknown";

        if (this._hass) {
          try {
            card.hass = this._hass;
          } catch (e) {
            console.error("[my-element] failed to assign hass:", e);
          }
        }

        this._container.appendChild(card);
        this._cards.push(card);

      } catch (e) {
        console.error(`[my-element] failed to create child #${i}`, e, cardConfig);
        this._container.appendChild(this._makeErrorBox(`Child #${i} failed`, e, cardConfig));
      }
    }
  }

  _makeErrorBox(title, error, config) {
    const box = document.createElement("div");
    box.innerHTML = `
      <strong>${this._escape(title)}</strong><br>
      <div>${this._escape(error?.message || String(error))}</div>
      ${config ? `<pre>${this._escape(JSON.stringify(config, null, 2))}</pre>` : ""}
    `;
    return box;
  }

  _escape(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
}

customElements.define("my-element", MyElement);