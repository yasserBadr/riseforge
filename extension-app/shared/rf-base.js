export const $ = (shadow, sel) => shadow.querySelector(sel);

export class RfBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.render();
    if (this.mount) this.mount();
  }
  get styles() {
    return "";
  }
  template() {
    return "";
  }
  render() {
    this.shadowRoot.innerHTML = "<style>" + this.styles + "</style>" + this.template();
  }
  attr(name, fallback) {
    const v = this.getAttribute(name);
    return v === null ? (fallback === undefined ? "" : fallback) : v;
  }
  hasAttr(name) {
    return this.hasAttribute(name);
  }
  emit(name, detail, opts) {
    const o = opts || {};
    this.dispatchEvent(
      new CustomEvent(name, {
        detail,
        bubbles: o.bubbles !== false,
        composed: o.composed !== false,
      })
    );
  }
}

export const baseControl = `
  :host { display: block; color: var(--rf-text); font: 14px/1.4 var(--rf-font); }
  .control {
    width: 100%; box-sizing: border-box;
    border: 1px solid var(--rf-border-strong);
    border-radius: var(--rf-radius-sm);
    padding: 8px 10px;
    background: var(--rf-surface);
    color: var(--rf-text);
    font: inherit;
    transition: border-color var(--rf-duration-fast) var(--rf-ease), box-shadow var(--rf-duration-fast) var(--rf-ease);
  }
  .control:hover { border-color: var(--rf-text-muted); }
  .control:focus-visible { outline: none; border-color: var(--rf-primary); box-shadow: var(--rf-shadow-glow); }
  .control::placeholder { color: var(--rf-text-muted); }
  .control:disabled { opacity: 0.5; cursor: not-allowed; }
  .label { display: block; font-size: 12px; font-weight: 600; color: var(--rf-text-secondary); margin-bottom: 5px; }
  .hint { font-size: 12px; color: var(--rf-text-muted); margin-top: 5px; }
`;

export function define(name, cls) {
  if (!customElements.get(name)) customElements.define(name, cls);
}