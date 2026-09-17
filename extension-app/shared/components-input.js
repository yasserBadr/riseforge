import { RfBase, $, baseControl, define } from "./rf-base.js";

class RfButton extends RfBase {
  get styles() {
    return `
      :host { display: inline-block; }
      :host([block]) { display: block; }
      button {
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        width: ${this.hasAttr("block") ? "100%" : "auto"};
        border: 1px solid transparent; border-radius: var(--rf-radius-sm);
        padding: ${this.attr("size", "md") === "sm" ? "5px 10px" : this.attr("size", "md") === "lg" ? "11px 18px" : "8px 14px"};
        font: 600 14px/1.2 var(--rf-font); cursor: pointer; color: var(--rf-text);
        background: var(--rf-surface-hover); white-space: nowrap;
        transition: background var(--rf-duration-fast) var(--rf-ease), transform var(--rf-duration-fast) var(--rf-ease);
      }
      button:hover { background: var(--rf-border); }
      button:active { transform: translateY(1px); }
      button:focus-visible { outline: none; box-shadow: var(--rf-shadow-glow); }
      button:disabled { opacity: 0.5; cursor: not-allowed; }
      button[data-kind="primary"] { background: var(--rf-primary); color: var(--rf-primary-contrast); }
      button[data-kind="primary"]:hover { background: var(--rf-primary-hover); }
      button[data-kind="ghost"] { background: transparent; color: var(--rf-primary); }
      button[data-kind="ghost"]:hover { background: var(--rf-primary-soft); }
      button[data-kind="danger"] { background: var(--rf-danger); color: #fff; }
      button[data-kind="danger"]:hover { filter: brightness(0.95); }
      button[data-kind="outline"] { background: var(--rf-surface); border-color: var(--rf-border-strong); }
      button[data-kind="outline"]:hover { background: var(--rf-surface-hover); }
    `;
  }
  template() {
    return `<button data-kind="${this.attr("kind", "secondary")}" ${this.hasAttr("disabled") ? "disabled" : ""}><slot></slot></button>`;
  }
  mount() {
    const btn = $(this.shadowRoot, "button");
    btn.addEventListener("click", (e) => this.emit("click", e));
  }
}

class RfInput extends RfBase {
  static get observedAttributes() {
    return ["value"];
  }
  get value() {
    return $(this.shadowRoot, "input").value;
  }
  set value(v) {
    const el = $(this.shadowRoot, "input");
    if (el) el.value = v;
  }
  get styles() {
    return baseControl;
  }
  template() {
    return `
      ${this.hasAttr("label") ? `<label class="label">${this.attr("label")}</label>` : ""}
      <input class="control" type="text" value="${this.attr("value")}" placeholder="${this.attr("placeholder")}"
        ${this.hasAttr("disabled") ? "disabled" : ""} spellcheck="false" />
      ${this.hasAttr("hint") ? `<div class="hint">${this.attr("hint")}</div>` : ""}
    `;
  }
  mount() {
    const el = $(this.shadowRoot, "input");
    el.addEventListener("input", () => this.emit("input", { value: el.value }));
    el.addEventListener("change", () => this.emit("change", { value: el.value }));
  }
  attributeChangedCallback(name, _old, value) {
    if (!this.isConnected || name !== "value") return;
    const el = $(this.shadowRoot, "input");
    if (el && el.value !== value && document.activeElement !== el) el.value = value;
  }
}

class RfTextarea extends RfBase {
  get value() {
    return $(this.shadowRoot, "textarea").value;
  }
  set value(v) {
    const el = $(this.shadowRoot, "textarea");
    if (el) el.value = v;
  }
  get styles() {
    return baseControl + "textarea{resize:vertical;min-height:60px;}";
  }
  template() {
    return `
      ${this.hasAttr("label") ? `<label class="label">${this.attr("label")}</label>` : ""}
      <textarea class="control" rows="${this.attr("rows", "3")}" placeholder="${this.attr("placeholder")}"
        ${this.hasAttr("disabled") ? "disabled" : ""} spellcheck="false"></textarea>
      ${this.hasAttr("hint") ? `<div class="hint">${this.attr("hint")}</div>` : ""}
    `;
  }
  mount() {
    const el = $(this.shadowRoot, "textarea");
    el.value = this.attr("value");
    el.addEventListener("input", () => this.emit("input", { value: el.value }));
    el.addEventListener("change", () => this.emit("change", { value: el.value }));
  }
}

class RfNumber extends RfBase {
  get value() {
    return $(this.shadowRoot, "input").value;
  }
  set value(v) {
    const el = $(this.shadowRoot, "input");
    if (el) el.value = v;
  }
  get styles() {
    return baseControl;
  }
  template() {
    return `
      ${this.hasAttr("label") ? `<label class="label">${this.attr("label")}</label>` : ""}
      <input class="control" type="number" value="${this.attr("value")}" step="${this.attr("step", "1")}"
        min="${this.attr("min")}" max="${this.attr("max")}" />
      ${this.hasAttr("hint") ? `<div class="hint">${this.attr("hint")}</div>` : ""}
    `;
  }
  mount() {
    const el = $(this.shadowRoot, "input");
    el.addEventListener("input", () => this.emit("input", { value: el.value }));
    el.addEventListener("change", () => this.emit("change", { value: parseFloat(el.value) }));
  }
}

class RfSelect extends RfBase {
  static get observedAttributes() {
    return ["value"];
  }
  get value() {
    return $(this.shadowRoot, "select").value;
  }
  set value(v) {
    const el = $(this.shadowRoot, "select");
    if (el) el.value = v;
  }
  get styles() {
    return baseControl + `
      select { appearance: none; padding-right: 28px; cursor: pointer;
        background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="%238a8fa3" stroke-width="2.4" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>');
        background-repeat: no-repeat; background-position: right 9px center;
      }
    `;
  }
  template() {
    const opts = this.attr("options")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean)
      .map((o) => `<option value="${o}">${o}</option>`)
      .join("");
    return `
      ${this.hasAttr("label") ? `<label class="label">${this.attr("label")}</label>` : ""}
      <select class="control">${opts}</select>
      ${this.hasAttr("hint") ? `<div class="hint">${this.attr("hint")}</div>` : ""}
    `;
  }
  mount() {
    const el = $(this.shadowRoot, "select");
    [...el.options].forEach((o) => (o.selected = o.value === this.attr("value")));
    el.addEventListener("change", () => this.emit("change", { value: el.value }));
  }
  attributeChangedCallback(name, _old, val) {
    if (this.isConnected && name === "value") {
      const el = $(this.shadowRoot, "select");
      if (el) el.value = val;
    }
  }
}

class RfToggle extends RfBase {
  static get observedAttributes() {
    return ["checked", "label"];
  }
  get checked() {
    return this.hasAttr("checked");
  }
  set checked(v) {
    this.toggleAttribute("checked", !!v);
  }
  get styles() {
    return `
      :host { display: inline-flex; align-items: center; color: var(--rf-text); font: 14px/1.4 var(--rf-font); }
      button {
        width: 38px; height: 22px; border-radius: var(--rf-radius-full);
        border: none; cursor: pointer; position: relative; flex: none;
        background: var(--rf-border-strong);
        transition: background var(--rf-duration-fast) var(--rf-ease);
      }
      button::after {
        content: ""; position: absolute; top: 3px; left: 3px;
        width: 16px; height: 16px; border-radius: 50%;
        background: #fff; box-shadow: var(--rf-shadow-sm);
        transition: transform var(--rf-duration-fast) var(--rf-ease);
      }
      button[data-on] { background: var(--rf-primary); }
      button[data-on]::after { transform: translateX(16px); }
      button:focus-visible { outline: none; box-shadow: var(--rf-shadow-glow); }
      button:disabled { opacity: 0.5; cursor: not-allowed; }
      label { margin-left: 8px; cursor: pointer; color: var(--rf-text-secondary); font-weight: 500; }
    `;
  }
  template() {
    return `<button role="switch" aria-checked="${this.hasAttr("checked")}" ${this.hasAttr("checked") ? "data-on" : ""}></button>
      ${this.hasAttr("label") ? `<label>${this.attr("label")}</label>` : ""}`;
  }
  mount() {
    const btn = $(this.shadowRoot, "button");
    btn.addEventListener("click", () => {
      if (this.hasAttr("disabled")) return;
      this.toggleAttribute("checked");
      this.emit("change", { checked: this.hasAttr("checked") });
    });
    const label = $(this.shadowRoot, "label");
    if (label) label.addEventListener("click", () => btn.click());
  }
  attributeChangedCallback(name, _old, _val) {
    if (!this.isConnected) return;
    const btn = $(this.shadowRoot, "button");
    if (!btn) return;
    const on = this.hasAttr("checked");
    btn.toggleAttribute("data-on", on);
    btn.setAttribute("aria-checked", String(on));
  }
}

class RfCheckbox extends RfBase {
  static get observedAttributes() {
    return ["checked"];
  }
  get checked() {
    const el = $(this.shadowRoot, "input");
    return el ? el.checked : this.hasAttr("checked");
  }
  set checked(v) {
    this.toggleAttribute("checked", !!v);
  }
  get styles() {
    return `
      :host { display: inline-flex; align-items: flex-start; color: var(--rf-text); font: 14px/1.4 var(--rf-font); }
      label { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; color: var(--rf-text-secondary); }
      input { width: 18px; height: 18px; accent-color: var(--rf-primary); cursor: pointer; }
      input:focus-visible { outline: 2px solid var(--rf-focus); outline-offset: 2px; }
    `;
  }
  template() {
    return `<label><input type="checkbox" ${this.hasAttr("checked") ? "checked" : ""} ${this.hasAttr("disabled") ? "disabled" : ""}/><span>${this.attr("label")}</span></label>`;
  }
  mount() {
    const input = $(this.shadowRoot, "input");
    input.addEventListener("change", () => this.emit("change", { checked: input.checked }));
  }
  attributeChangedCallback(name, _old, _val) {
    if (!this.isConnected) return;
    const input = $(this.shadowRoot, "input");
    if (input) input.checked = this.hasAttr("checked");
  }
}

class RfRadioGroup extends RfBase {
  static get observedAttributes() {
    return ["value"];
  }
  get value() {
    return this.attr("value");
  }
  get styles() {
    return `
      :host { display: block; color: var(--rf-text); font: 14px/1.4 var(--rf-font); }
      .label { font-size: 12px; font-weight: 600; color: var(--rf-text-secondary); margin-bottom: 5px; display: block; }
      .group { display: flex; flex-direction: column; gap: 6px; }
      .option {
        display: flex; align-items: center; gap: 9px; padding: 7px 9px; border-radius: var(--rf-radius-sm);
        border: 1px solid var(--rf-border); cursor: pointer;
        transition: border-color var(--rf-duration-fast) var(--rf-ease), background var(--rf-duration-fast) var(--rf-ease);
      }
      .option:hover { background: var(--rf-surface-hover); }
      .option[data-on] { border-color: var(--rf-primary); background: var(--rf-primary-soft); }
      .dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--rf-border-strong); flex: none; box-sizing: border-box; }
      .option[data-on] .dot { border-color: var(--rf-primary); box-shadow: inset 0 0 0 4px var(--rf-primary); }
    `;
  }
  template() {
    const opts = this.attr("options")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    const list = opts
      .map(
        (o) =>
          `<div class="option" data-value="${o}" ${o === this.attr("value") ? "data-on" : ""}><span class="dot"></span>${o}</div>`
      )
      .join("");
    return `${this.hasAttr("label") ? `<span class="label">${this.attr("label")}</span>` : ""}<div class="group">${list}</div>`;
  }
  mount() {
    const root = this.shadowRoot;
    root.querySelectorAll(".option").forEach((el) => {
      el.addEventListener("click", () => {
        root.querySelectorAll(".option").forEach((o) => o.removeAttribute("data-on"));
        el.setAttribute("data-on", "");
        this.setAttribute("value", el.dataset.value);
        this.emit("change", { value: el.dataset.value });
      });
    });
  }
}

export function registerInputComponents() {
  const defs = [
    ["rf-button", RfButton],
    ["rf-input", RfInput],
    ["rf-textarea", RfTextarea],
    ["rf-number", RfNumber],
    ["rf-select", RfSelect],
    ["rf-toggle", RfToggle],
    ["rf-checkbox", RfCheckbox],
    ["rf-radio-group", RfRadioGroup],
  ];
  for (const [name, cls] of defs) define(name, cls);
}