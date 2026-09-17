import { RfBase, $, define } from "./rf-base.js";

class RfSlider extends RfBase {
  static get observedAttributes() {
    return ["value"];
  }
  get value() {
    return parseFloat($(this.shadowRoot, "input").value);
  }
  get styles() {
    return `
      :host { display: block; color: var(--rf-text); font: 14px/1.4 var(--rf-font); }
      .row { display: flex; align-items: center; gap: 10px; }
      input { flex: 1; accent-color: var(--rf-primary); cursor: pointer; }
      .val { min-width: 42px; text-align: right; font-variant-numeric: tabular-nums; color: var(--rf-text-secondary); font-size: 13px; }
      .label { font-size: 12px; font-weight: 600; color: var(--rf-text-secondary); margin-bottom: 5px; display: block; }
    `;
  }
  template() {
    return `
      ${this.hasAttr("label") ? `<span class="label">${this.attr("label")}</span>` : ""}
      <div class="row">
        <input type="range" min="${this.attr("min", "0")}" max="${this.attr("max", "100")}" step="${this.attr("step", "1")}" value="${this.attr("value", "0")}" />
        <span class="val">${this.attr("value", "0")}${this.attr("unit")}</span>
      </div>
    `;
  }
  mount() {
    const input = $(this.shadowRoot, "input");
    const val = $(this.shadowRoot, ".val");
    input.addEventListener("input", () => {
      val.textContent = input.value + this.attr("unit");
      this.setAttribute("value", input.value);
      this.emit("input", { value: parseFloat(input.value) });
    });
    input.addEventListener("change", () => this.emit("change", { value: parseFloat(input.value) }));
  }
  attributeChangedCallback(name, _old, v) {
    if (!this.isConnected || name !== "value") return;
    const input = $(this.shadowRoot, "input");
    if (input) input.value = v;
  }
}

class RfColorInput extends RfBase {
  static get observedAttributes() {
    return ["value", "recents"];
  }
  get value() {
    return this.attr("value", "#6d5df6");
  }
  get styles() {
    return `
      :host { display: inline-flex; align-items: center; gap: 8px; color: var(--rf-text); font: 14px/1.4 var(--rf-font); }
      .swatch { width: 34px; height: 34px; border-radius: var(--rf-radius-sm); border: 1px solid var(--rf-border-strong); cursor: pointer; padding: 0; background: ${this.value}; position: relative; flex: none; }
      .swatch::after { content: ""; position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.08); }
      input[type="color"] { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
      code { font: 12px var(--rf-mono); color: var(--rf-text-secondary); }
      .recents { display: flex; gap: 4px; margin-left: 4px; }
      .recent { width: 20px; height: 20px; border-radius: 50%; border: 1px solid var(--rf-border-strong); cursor: pointer; flex: none; }
      .recent:hover { transform: scale(1.12); }
    `;
  }
  template() {
    const recents = this.attr("recents")
      .split(",")
      .filter(Boolean)
      .map((c) => `<button class="recent" style="background:${c}" data-color="${c}" aria-label="${c}"></button>`)
      .join("");
    return `
      <span class="swatch"><input type="color" value="${this.value}"/></span>
      <code>${this.value}</code>
      ${recents ? `<span class="recents">${recents}</span>` : ""}
    `;
  }
  mount() {
    const picker = $(this.shadowRoot, 'input[type="color"]');
    const code = $(this.shadowRoot, "code");
    picker.addEventListener("input", () => {
      this.setAttribute("value", picker.value);
      code.textContent = picker.value;
      this.emit("input", { value: picker.value });
    });
    picker.addEventListener("change", () => this.emit("change", { value: picker.value }));
    this.shadowRoot.querySelectorAll(".recent").forEach((btn) => {
      btn.addEventListener("click", () => this.emit("change", { value: btn.dataset.color }));
    });
  }
  attributeChangedCallback(name, _old, v) {
    if (!this.isConnected || name === "recents") return;
    const picker = $(this.shadowRoot, 'input[type="color"]');
    if (picker) picker.value = v;
  }
}

class RfPanel extends RfBase {
  static get observedAttributes() {
    return ["open", "title"];
  }
  get styles() {
    return `
      :host { display: block; border: 1px solid var(--rf-border); border-radius: var(--rf-radius-md); background: var(--rf-surface); overflow: hidden; }
      header { display: flex; align-items: center; justify-content: space-between; padding: 11px 14px; cursor: pointer; user-select: none; }
      header:hover { background: var(--rf-surface-hover); }
      .title { font-weight: 600; font-size: 13px; color: var(--rf-text); }
      .chev { display: inline-block; width: 8px; height: 8px; border-right: 2px solid var(--rf-text-muted); border-bottom: 2px solid var(--rf-text-muted); transform: rotate(45deg); transition: transform var(--rf-duration-fast) var(--rf-ease); }
      :host([open]) .chev { transform: rotate(-135deg); }
      .body { padding: 0 14px 14px; }
      table {
        width: 100%; margin-top: 8px; border-collapse: collapse; font-size: 13px;
        table-layout: fixed;
      }
      th { text-align: left; font-size: 12px; color: var(--rf-text-muted); font-weight: 600; padding: 6px 0; border-bottom: 1px solid var(--rf-border); }
      td { padding: 8px 0; border-bottom: 1px solid var(--rf-border); color: var(--rf-text-secondary); }
      tr:last-child td { border-bottom: none; }
    `;
  }
  template() {
    return `
      <header><span class="title">${this.attr("title")}</span><span class="chev"></span></header>
      ${this.hasAttr("open") ? `<div class="body"><slot></slot></div>` : ""}
    `;
  }
  mount() {
    $(this.shadowRoot, "header").addEventListener("click", () => {
      this.toggleAttribute("open");
      this.renderBody();
    });
  }
  renderBody() {
    const body = $(this.shadowRoot, ".body");
    if (this.hasAttr("open") && !body) {
      this.shadowRoot.insertAdjacentHTML("beforeend", '<div class="body"><slot></slot></div>');
    } else if (!this.hasAttr("open") && body) {
      body.remove();
    }
  }
  attributeChangedCallback(name, _old, _v) {
    if (this.isConnected) this.renderBody();
  }
}

class RfPill extends RfBase {
  get styles() {
    const tone = this.attr("tone", "neutral");
    const map = {
      neutral: "rgba(138,143,163,0.14);color:#565a6b",
      primary: "var(--rf-primary-soft);color:var(--rf-primary)",
      success: "var(--rf-success-soft);color:var(--rf-success)",
      warning: "var(--rf-warning-soft);color:var(--rf-warning)",
      danger: "var(--rf-danger-soft);color:var(--rf-danger)",
    };
    return `
      :host { display: inline-block; }
      span { display: inline-flex; align-items: center; gap: 4px; padding: 2px 9px; border-radius: var(--rf-radius-full); font: 600 11.5px/1.6 var(--rf-font); background:${map[tone] || map.neutral}; }
      .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    `;
  }
  template() {
    return `<span>${this.hasAttr("dot") ? '<span class="dot"></span>' : ""}<slot></slot></span>`;
  }
}

class RfSegmented extends RfBase {
  static get observedAttributes() {
    return ["value", "options"];
  }
  get styles() {
    return `
      :host { display: inline-flex; padding: 3px; background: var(--rf-surface-sunken); border-radius: var(--rf-radius-sm); gap: 2px; font: 600 13px/1.2 var(--rf-font); }
      button { border: none; background: transparent; padding: 6px 12px; border-radius: 5px; cursor: pointer; color: var(--rf-text-secondary); transition: background var(--rf-duration-fast) var(--rf-ease), color var(--rf-duration-fast) var(--rf-ease); }
      button[data-on] { background: var(--rf-surface); color: var(--rf-primary); box-shadow: var(--rf-shadow-sm); }
      button:focus-visible { outline: none; box-shadow: var(--rf-shadow-glow); }
    `;
  }
  template() {
    const opts = this.attr("options")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    const items = opts
      .map((o) => `<button data-value="${o}" ${o === this.attr("value") ? "data-on" : ""}>${o}</button>`)
      .join("");
    return items;
  }
  get active() {
    return this.attr("value");
  }
  mount() {
    this.shadowRoot.querySelectorAll("button").forEach((b) => {
      b.addEventListener("click", () => {
        this.shadowRoot.querySelectorAll("button").forEach((x) => x.removeAttribute("data-on"));
        b.setAttribute("data-on", "");
        this.setAttribute("value", b.dataset.value);
        this.emit("change", { value: b.dataset.value });
      });
    });
  }
  attributeChangedCallback(name, _old, v) {
    if (!this.isConnected || name !== "value") return;
    this.shadowRoot.querySelectorAll("button").forEach((b) => {
      b.toggleAttribute("data-on", b.dataset.value === v);
    });
  }
}

class RfSearch extends RfBase {
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
    return `
      :host { display: block; position: relative; }
      input {
        width: 100%; box-sizing: border-box; padding: 8px 12px 8px 34px;
        border: 1px solid var(--rf-border-strong); border-radius: var(--rf-radius-full);
        font: 14px/1.4 var(--rf-font); color: var(--rf-text); background: var(--rf-surface);
        transition: border-color var(--rf-duration-fast) var(--rf-ease), box-shadow var(--rf-duration-fast) var(--rf-ease);
      }
      input:focus-visible { outline: none; border-color: var(--rf-primary); box-shadow: var(--rf-shadow-glow); }
      .icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); width: 15px; height: 15px; stroke: var(--rf-text-muted); pointer-events: none; }
      .clear { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); border: none; background: var(--rf-surface-hover); width: 20px; height: 20px; border-radius: 50%; cursor: pointer; color: var(--rf-text-muted); font-size: 12px; line-height: 1; }
      .clear:hover { background: var(--rf-border); }
    `;
  }
  template() {
    return `
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke-width="2.4"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
      <input type="text" placeholder="${this.attr("placeholder", "Search")}" value="${this.attr("value")}" aria-label="${this.attr("placeholder", "Search")}"/>
      <button class="clear" aria-label="Clear">&times;</button>
    `;
  }
  mount() {
    const input = $(this.shadowRoot, "input");
    const clear = $(this.shadowRoot, ".clear");
    input.addEventListener("input", () => {
      clear.style.display = input.value ? "block" : "none";
      this.setAttribute("value", input.value);
      this.emit("input", { value: input.value });
    });
    clear.addEventListener("click", () => {
      input.value = "";
      clear.style.display = "none";
      this.removeAttribute("value");
      this.emit("input", { value: "" });
      input.focus();
    });
  }
  attributeChangedCallback(name, _old, v) {
    if (!this.isConnected || name !== "value") return;
    const input = $(this.shadowRoot, "input");
    if (input) input.value = v;
  }
}

class RfSpinner extends RfBase {
  get styles() {
    return `
      :host { display: inline-block; width: ${this.attr("size", "20")}px; height: ${this.attr("size", "20")}px; }
      .ring { width: 100%; height: 100%; border-radius: 50%; border: 2.5px solid var(--rf-border); border-top-color: var(--rf-primary); animation: spin 0.8s linear infinite; box-sizing: border-box; }
      @keyframes spin { to { transform: rotate(360deg); } }
    `;
  }
  template() {
    return '<div class="ring"></div>';
  }
}

const TOAST_STYLES = `
  :host { all: initial; position: fixed; right: 20px; bottom: 20px; z-index: 2147483600; display: flex; flex-direction: column; gap: 8px; }
  .toast {
    display: flex; align-items: center; gap: 10px; min-width: 260px; max-width: 380px;
    background: var(--rf-surface-raised); color: var(--rf-text);
    border: 1px solid var(--rf-border); border-radius: var(--rf-radius-md);
    padding: 11px 14px; box-shadow: var(--rf-shadow-lg);
    font: 14px/1.4 var(--rf-font);
    animation: toast-in 200ms var(--rf-ease) both;
    cursor: pointer;
  }
  .icon { width: 8px; height: 8px; border-radius: 50%; flex: none; background: var(--rf-primary); }
  .icon[data-tone="success"] { background: var(--rf-success); }
  .icon[data-tone="warning"] { background: var(--rf-warning); }
  .icon[data-tone="danger"] { background: var(--rf-danger); }
  .msg { flex: 1; }
  .close { border: none; background: none; color: var(--rf-text-muted); cursor: pointer; font-size: 16px; line-height: 1; padding: 2px; }
  .close:hover { color: var(--rf-text); }
  @keyframes toast-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  @keyframes toast-out { to { opacity: 0; transform: translateX(16px); } }
  .leaving { animation: toast-out 180ms var(--rf-ease) both; }
`;

class RfToastHost extends RfBase {
  get styles() {
    return TOAST_STYLES;
  }
  template() {
    return "";
  }
  show(message, tone) {
    const t = this.shadowRoot.ownerDocument.createElement("div");
    t.className = "toast";
    t.innerHTML = `<span class="icon" data-tone="${tone || "info"}"></span><span class="msg"></span><button class="close" aria-label="Dismiss">&times;</button>`;
    t.querySelector(".msg").textContent = message;
    const dismiss = () => {
      t.classList.add("leaving");
      setTimeout(() => t.remove(), 190);
    };
    t.addEventListener("click", dismiss);
    this.shadowRoot.appendChild(t);
    setTimeout(dismiss, message.length > 60 ? 6500 : 4200);
  }
}

let toastHost = null;
export function toast(message, tone) {
  if (!toastHost) {
    toastHost = document.createElement("rf-toast-host");
    document.body.appendChild(toastHost);
  }
  toastHost.show(message, tone);
}

class RfDialog extends RfBase {
  static get observedAttributes() {
    return ["open", "title"];
  }
  get styles() {
    return `
      :host { all: initial; position: fixed; inset: 0; z-index: 2147483400; display: none; }
      :host([open]) { display: flex; align-items: center; justify-content: center; }
      .scrim { position: absolute; inset: 0; background: rgba(20, 22, 30, 0.42); animation: fade 150ms var(--rf-ease); }
      .card {
        position: relative; width: min(460px, 90vw); max-height: 78vh; overflow: auto;
        background: var(--rf-surface-raised); border-radius: var(--rf-radius-lg);
        box-shadow: var(--rf-shadow-lg); padding: 20px;
        font: 14px/1.5 var(--rf-font); color: var(--rf-text);
        animation: pop 170ms var(--rf-ease);
      }
      .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
      .title { font-weight: 700; font-size: 16px; }
      .close { border: none; background: var(--rf-surface-hover); width: 26px; height: 26px; border-radius: var(--rf-radius-full); cursor: pointer; color: var(--rf-text-muted); font-size: 16px; flex: none; }
      .close:hover { background: var(--rf-border); color: var(--rf-text); }
      .body { margin: 12px 0 18px; }
      .actions { display: flex; gap: 8px; justify-content: flex-end; }
      @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
      @keyframes pop { from { opacity: 0; transform: scale(0.96) translateY(4px); } to { opacity: 1; transform: none; } }
    `;
  }
  template() {
    return `
      <div class="scrim"></div>
      <div class="card">
        <div class="head">
          <div class="title">${this.attr("title", "")}</div>
          <button class="close" aria-label="Close">&times;</button>
        </div>
        <div class="body"><slot></slot></div>
        <div class="actions"><slot name="actions"></slot></div>
      </div>
    `;
  }
  open() {
    this.setAttribute("open", "");
  }
  close() {
    this.removeAttribute("open");
  }
  confirm(message, options) {
    return new Promise((resolve) => {
      const opts = options || {};
      const actions = this.shadowRoot.querySelector('slot[name="actions"]');
      actions.innerHTML = "";
      const mk = (label, kind) => {
        const b = this.shadowRoot.ownerDocument.createElement("rf-button");
        b.setAttribute("kind", kind);
        b.textContent = label;
        return b;
      };
      const cancel = mk(opts.cancelLabel || "Cancel", "outline");
      const ok = mk(opts.confirmLabel || "Confirm", opts.kind || "primary");
      actions.append(cancel, ok);
      cancel.addEventListener("click", () => {
        this.close();
        resolve(false);
      });
      ok.addEventListener("click", () => {
        this.close();
        resolve(true);
      });
      const body = this.shadowRoot.querySelector(".body");
      body.textContent = message;
      this.setAttribute("title", opts.title || "Are you sure?");
      this.open();
    });
  }
  mount() {
    $(this.shadowRoot, ".scrim").addEventListener("click", () => this.close());
    $(this.shadowRoot, ".close").addEventListener("click", () => this.close());
  }
}

class RfEmptyState extends RfBase {
  get styles() {
    return `
      :host { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 32px 16px; text-align: center; color: var(--rf-text-muted); font: 14px/1.5 var(--rf-font); }
      .icon { font-size: 30px; margin-bottom: 4px; }
      .title { font-weight: 600; color: var(--rf-text-secondary); font-size: 14px; }
      :host([compact]) { padding: 16px; }
    `;
  }
  template() {
    return `<div class="icon">${this.attr("icon", "\u2726")}</div><div class="title">${this.attr("title")}</div><slot></slot>`;
  }
}

class RfMenuItem extends RfBase {
  get styles() {
    return `
      :host { display: block; }
      button {
        position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 3px;
        width: 100%; box-sizing: border-box; text-align: left; cursor: pointer;
        border: 1px solid var(--rf-border); border-radius: var(--rf-radius-md);
        background: var(--rf-surface); padding: 13px 14px;
        transition: border-color var(--rf-duration-fast) var(--rf-ease), box-shadow var(--rf-duration-fast) var(--rf-ease), transform var(--rf-duration-fast) var(--rf-ease);
        font: 14px/1.4 var(--rf-font); color: var(--rf-text);
      }
      button:hover { border-color: var(--rf-primary); box-shadow: var(--rf-shadow-md); }
      button:active { transform: translateY(1px); }
      button:focus-visible { outline: none; box-shadow: var(--rf-shadow-glow); }
      .title { font-weight: 650; }
      .desc { font-size: 12.5px; color: var(--rf-text-muted); }
      .badge { position: absolute; top: 10px; right: 10px; }
      .arrow { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--rf-text-muted); font-size: 17px; }
    `;
  }
  template() {
    return `
      <button>
        ${this.hasAttr("badge") ? `<span class="badge"><rf-pill tone="success" dot>${this.attr("badge")}</rf-pill></span>` : ""}
        <span class="title">${this.attr("title")}</span>
        ${this.hasAttr("description") ? `<span class="desc">${this.attr("description")}</span>` : ""}
        <span class="arrow">&#8250;</span>
      </button>
    `;
  }
  mount() {
    $(this.shadowRoot, "button").addEventListener("click", (e) => {
      const href = this.attr("href");
      if (href) location.href = href;
      else this.emit("click", this);
    });
  }
}

class RfCodeEditor extends RfBase {
  static get observedAttributes() {
    return ["value", "language"];
  }
  get value() {
    return $(this.shadowRoot, "textarea").value;
  }
  set value(v) {
    const el = $(this.shadowRoot, "textarea");
    if (el) el.value = v;
  }
  get styles() {
    return `
      :host { display: block; border: 1px solid var(--rf-border-strong); border-radius: var(--rf-radius-sm); overflow: hidden; background: #0f1117; }
      .wrap { display: flex; max-height: 320px; overflow: hidden; font: 13px/1.55 var(--rf-mono); color: #d7dae3; }
      .gut { flex: none; width: 42px; padding: 10px 8px 10px 0; text-align: right; user-select: none; color: #4a4e5c; background: #0f1117; border-right: 1px solid #1e2230; box-sizing: border-box; }
      .lines { overflow: hidden; }
      textarea { flex: 1; border: none; outline: none; resize: none; background: transparent; color: inherit; font: inherit; padding: 10px 12px; min-height: 140px; tab-size: 2; white-space: pre; overflow: auto; box-sizing: border-box; }
      .bar { display: flex; align-items: center; justify-content: space-between; padding: 4px 10px; background: #161a26; color: #8a8fa3; font: 600 11px var(--rf-font); text-transform: uppercase; letter-spacing: 0.04em; }
      .status[data-dirty] { color: var(--rf-warning); }
    `;
  }
  template() {
    return `
      <div class="bar"><span>${this.attr("language", "code")}</span><span class="status">synced</span></div>
      <div class="wrap">
        <div class="gut"></div>
        <textarea spellcheck="false" placeholder="${this.attr("placeholder", "")}"></textarea>
      </div>
    `;
  }
  mount() {
    const ta = $(this.shadowRoot, "textarea");
    const gut = $(this.shadowRoot, ".gut");
    const status = $(this.shadowRoot, ".status");
    ta.value = this.attr("value");
    const paint = () => {
      gut.textContent = ta.value.split("\n").map((_, i) => i + 1).join("\n");
    };
    paint();
    ta.addEventListener("input", () => {
      paint();
      status.textContent = "unsaved";
      status.toggleAttribute("data-dirty", true);
      this.emit("input", { value: ta.value });
    });
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const s = ta.selectionStart;
        ta.setRangeText("  ", s, ta.selectionEnd, "end");
        paint();
        this.emit("input", { value: ta.value });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        status.textContent = "synced";
        status.removeAttribute("data-dirty");
        this.emit("change", { value: ta.value });
      }
    });
    const sync = () => {
      status.textContent = "synced";
      status.removeAttribute("data-dirty");
    };
    this.addEventListener("blur", sync, true);
  }
  attributeChangedCallback(name, _old, v) {
    if (!this.isConnected || name !== "value") return;
    const ta = $(this.shadowRoot, "textarea");
    if (ta && ta.value !== v) ta.value = v;
  }
}

export function registerDisplayComponents() {
  const defs = [
    ["rf-slider", RfSlider],
    ["rf-color-input", RfColorInput],
    ["rf-panel", RfPanel],
    ["rf-pill", RfPill],
    ["rf-segmented", RfSegmented],
    ["rf-search", RfSearch],
    ["rf-spinner", RfSpinner],
    ["rf-toast-host", RfToastHost],
    ["rf-dialog", RfDialog],
    ["rf-empty-state", RfEmptyState],
    ["rf-menu-item", RfMenuItem],
    ["rf-code-editor", RfCodeEditor],
  ];
  for (const [name, cls] of defs) define(name, cls);
}