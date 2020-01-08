import {
  html,
  LitElement
} from 'lit-element';

export default class Slider extends LitElement {

  constructor() {
    super();
    this.name = "Slideshow";
    this.count = 0;
    this.show = [];
    this.transition = "ease-out";
    this.duration = 3500;
    this.frame = undefined;
    this.id = 0;
  }

  static get properties() {
    return {
      frame: {
        type: Object
      }
    }
  }

  backDrop() {
    if (this.id) {
      clearInterval(this.id);
    }
    let element = this.show.pop();
    this.show.unshift(element);
    this.doTick();
  }

  nextDrop() {
    if (this.id) {
      clearInterval(this.id);
    }
    let previous = this.show.shift();
    this.show.push(previous);
    this.doTick();
  }

  doTick() {
    this.id = setTimeout(() => {
      let step = {
        previous: this.show[this.count - 1],
        current: this.show[0],
        next: this.show[1]
      }
      this.frame = Object.assign({}, step)
      this.nextDrop();
    }, this.duration);
  }

  connectedCallback() {
    let main = this.querySelectorAll('div.drop');
    this.doTick();
    return html `
      <div>
        <div class="drop"></div>
        <div class="drop"></div>
        <span class="bulma-container"></span>
      </div>
      `;
  }
}

customElements.define("main-slider", Slider);