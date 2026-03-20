import { LitElement, html, css } from "https://unpkg.com/lit@2.0.0/index.js?module";

export class MyElement extends LitElement {

  static properties = {
    hass: {},
    config: {}
  };

  setConfig(config) {
    this.config = config;

    if (!config.cards) {
      throw new Error("Cards are required");
    }

    const helpers = window.loadCardHelpers();

    helpers.then(h => {
      this._cards = config.cards.map(cardConfig => {
        const card = h.createCardElement(cardConfig);
        return card;
      });

      this.requestUpdate();
    });
  }

  set hass(hass) {
    this._hass = hass;

    if (this._cards) {
      this._cards.forEach(card => {
        card.hass = hass;
      });
    }
  }

  get hass() {
    return this._hass;
  }

  static styles = css`
    .wrapper{
      display:flex;
      justify-content:flex-start;
      container-type:inline-size;
    }

    .container{
      column-width:320px;
      column-gap:8px;
      column-count:3;
      width:976px;
    }

    @container(max-width:1000px){
      .container{
        column-count:2;
        width:648px;
      }
    }

    @container(max-width:670px){
      .container{
        column-count:1;
        width:320px;
      }
    }

    .container > *{
      display:inline-block;
      width:320px;
      margin-bottom:8px;
      break-inside:avoid;
    }
  `;

  render() {
    if (!this._cards) return html``;

    return html`
      <div class="wrapper">
        <div class="container">
          ${this._cards.map(card => html`${card}`)}
        </div>
      </div>
    `;
  }
}

customElements.define("my-element", MyElement);