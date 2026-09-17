import "../../shared/components.js";
import "../../shared/components-input.js";
import {
  registerInputComponents,
} from "../../shared/components-input.js";
import { registerDisplayComponents, toast } from "../../shared/components.js";
import { BLOCK_LIST, getBlock, defaultConfigOf } from "../registry.js";
import { BlockStore, createBlock } from "../block-api.js";
import { registerAllPowerups, powerupList, applyEnabledPowerups } from "../../powerups/index.js";
import { getConfig, setConfig, getEnabled, setEnabled } from "../../powerups/registry.js";
import { textInput, textareaField, toggleField, numberField, selectField, colorField } from "./form-helper.js";
import { mountModsPanel } from "./mods-panel.js";

registerInputComponents();
registerDisplayComponents();
registerAllPowerups();

const HOST_ID = "riseforge-editor-shell";

function ensureHost() {
  let host = document.getElementById(HOST_ID);
  if (host) return host;
  host = document.createElement("div");
  host.id = HOST_ID;
  host.style.cssText =
    "all: initial; position: fixed; z-index: 2147483300; bottom: 22px; right: 22px; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; font-family: var(--rf-font, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);";
  document.body.appendChild(host);
  return host;
}

function fab(label, tint) {
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.setAttribute("aria-label", label);
  btn.style.cssText =
    "border: none; cursor: pointer; font: 600 14px/1.2 var(--rf-font, -apple-system); color: #fff; " +
    (tint === "violet"
      ? "background: var(--rf-primary, #6d5df6); box-shadow: 0 6px 18px rgba(109,93,246,.35);"
      : tint === "ink"
        ? "background: #1c1e26; box-shadow: 0 6px 18px rgba(28,30,38,.3);"
        : "background: #fff; color: #1c1e26; border: 1px solid #e2e4ee; box-shadow: 0 6px 18px rgba(28,30,38,.12);") +
    " min-width: 108px; padding: 12px 18px; border-radius: 999px; transition: transform .12s ease, box-shadow .12s ease;";
  btn.addEventListener("mouseenter", () => (btn.style.transform = "translateY(-2px)"));
  btn.addEventListener("mouseleave", () => (btn.style.transform = ""));
  return btn;
}

function panelShell(title, onClose) {
  const scrim = document.createElement("div");
  scrim.style.cssText =
    "position: fixed; inset: 0; z-index: 2147483200; background: rgba(20,22,30,.4); opacity: 0; transition: opacity .18s ease;";
  requestAnimationFrame(() => (scrim.style.opacity = "1"));

  const panel = document.createElement("div");
  panel.style.cssText =
    "position: fixed; z-index: 2147483250; top: 0; right: 0; bottom: 0; width: min(440px, 92vw); " +
    "background: #fff; box-shadow: -12px 0 32px rgba(28,30,38,.18); transform: translateX(12px); opacity: 0; transition: transform .18s ease, opacity .18s ease; " +
    "display: flex; flex-direction: column; font: 14px/1.5 var(--rf-font, -apple-system, Roboto, sans-serif);";
  requestAnimationFrame(() => {
    panel.style.transform = "none";
    panel.style.opacity = "1";
  });

  const header = document.createElement("div");
  header.style.cssText =
    "display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid #e2e4ee;";
  const hTitle = document.createElement("div");
  hTitle.style.cssText = "font-weight: 700; font-size: 15px; color: #1c1e26;";
  hTitle.textContent = title;
  const close = document.createElement("button");
  close.textContent = "\u00d7";
  close.setAttribute("aria-label", "Close panel");
  close.style.cssText =
    "border: none; background: #f0f1f7; width: 28px; height: 28px; border-radius: 999px; cursor: pointer; font-size: 17px; color: #565a6b; line-height: 1;";
  close.addEventListener("mouseenter", () => (close.style.background = "#e2e4ee"));
  close.addEventListener("mouseleave", () => (close.style.background = "#f0f1f7"));
  close.addEventListener("click", closeAll);

  header.append(hTitle, close);

  const body = document.createElement("div");
  body.style.cssText = "flex: 1; overflow-y: auto; padding: 16px 18px;";

  panel.append(header, body);

  function closeAll() {
    scrim.style.opacity = "0";
    panel.style.transform = "translateX(12px)";
    panel.style.opacity = "0";
    setTimeout(() => {
      scrim.remove();
      panel.remove();
      onClose && onClose();
    }, 190);
  }
  scrim.addEventListener("click", closeAll);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  }, { once: true });

  document.body.append(panel, scrim);
  return { body, close: closeAll };
}

function mountLibrary(body, store, host) {
  const searchWrap = document.createElement("div");
  searchWrap.style.cssText = "margin-bottom: 14px;";
  const search = document.createElement("rf-search");
  search.setAttribute("placeholder", "Search blocks...");
  searchWrap.appendChild(search);
  body.appendChild(searchWrap);

  const grid = document.createElement("div");
  grid.style.cssText =
    "display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-bottom: 24px;";
  body.appendChild(grid);

  const render = (query) => {
    grid.innerHTML = "";
    const list = BLOCK_LIST.filter((b) =>
      !query || (b.name + " " + b.description + " " + b.category).toLowerCase().includes(query)
    );
    if (!list.length) {
      const empty = document.createElement("rf-empty-state");
      empty.setAttribute("title", "No blocks found");
      empty.setAttribute("icon", "\u2315");
      grid.appendChild(empty);
      return;
    }
    list.forEach((block) => {
      const card = document.createElement("button");
      card.type = "button";
      card.style.cssText =
        "text-align: left; cursor: pointer; padding: 14px; border: 1px solid #e2e4ee; border-radius: 12px; background: #fff; " +
        "transition: border-color .12s, box-shadow .12s, transform .12s;";
      card.addEventListener("mouseenter", () => {
        card.style.borderColor = "#6d5df6";
        card.style.boxShadow = "0 4px 14px rgba(109,93,246,.14)";
      });
      card.addEventListener("mouseleave", () => {
        card.style.borderColor = "#e2e4ee";
        card.style.boxShadow = "none";
      });
      const icon = document.createElement("div");
      icon.textContent = block.icon;
      icon.style.cssText =
        "width: 34px; height: 34px; border-radius: 9px; background: rgba(109,93,246,.1); color: #6d5df6; " +
        "display: flex; align-items: center; justify-content: center; font-weight: 800; margin-bottom: 9px;";
      const name = document.createElement("div");
      name.textContent = block.name;
      name.style.cssText = "font-weight: 650; color: #1c1e26; font-size: 13.5px;";
      const desc = document.createElement("div");
      desc.textContent = block.description;
      desc.style.cssText = "font-size: 11.5px; color: #8a8fa3; margin-top: 2px; line-height: 1.35;";
      const category = document.createElement("div");
      category.textContent = block.category;
      category.style.cssText =
        "display: inline-block; margin-top: 8px; font-size: 10.5px; font-weight: 700; color: #565a6b; " +
        "background: #f6f7fb; border-radius: 999px; padding: 2px 8px;";
      card.append(icon, name, desc, category);
      card.addEventListener("click", () => {
        const idBlock = createBlock("b-" + crypto.randomUUID().slice(0, 8), block.id, defaultConfigOf(block.id));
        store.upsert(idBlock);
        toast('Added "' + block.name + '" to lesson', "success");
        trackBlockAdded(block.id);
      });
      grid.appendChild(card);
    });
  };
  render("");
  search.addEventListener("input", (e) => render((e.detail.value || "").toLowerCase()));
}

function trackBlockAdded(blockType) {
  const ev = new CustomEvent("riseforge:track", { detail: { event: "block_added", payload: { blockType } } });
  window.dispatchEvent(ev);
}

function mountPowerups(body, courseId) {
  const intro = document.createElement("p");
  intro.textContent = "Course-wide enhancements applied to every page and on publish.";
  intro.style.cssText = "font-size: 13px; color: #565a6b; margin: 0 0 14px; line-height: 1.5;";
  body.appendChild(intro);

  const list = document.createElement("div");
  list.style.cssText = "display: flex; flex-direction: column; gap: 10px;";
  body.appendChild(list);

  powerupList().forEach((p) => {
    const card = document.createElement("div");
    card.style.cssText =
      "border: 1px solid #e2e4ee; border-radius: 12px; padding: 12px 14px; background: #fff;";
    const top = document.createElement("div");
    top.style.cssText = "display: flex; justify-content: space-between; align-items: center; gap: 10px;";
    const name = document.createElement("div");
    name.style.cssText = "font-weight: 650; font-size: 13.5px; color: #1c1e26;";
    name.textContent = p.name;
    const toggle = document.createElement("rf-toggle");
    if (getEnabled(p.id)) toggle.setAttribute("checked", "");
    toggle.addEventListener("change", (e) => {
      setEnabled(p.id, e.detail.checked);
      toast((e.detail.checked ? "Enabled " : "Disabled ") + p.name, e.detail.checked ? "success" : "info");
      reapplyPowerups(courseId);
    });
    top.append(name, toggle);

    const desc = document.createElement("div");
    desc.textContent = p.description;
    desc.style.cssText = "font-size: 12px; color: #8a8fa3; margin-top: 4px;";

    const edit = document.createElement("button");
    edit.textContent = "Configure";
    edit.style.cssText =
      "margin-top: 10px; border: 1px solid #e2e4ee; border-radius: 8px; background: #f6f7fb; cursor: pointer; font: 600 12.5px/1.2 sans-serif; padding: 6px 12px; color: #565a6b;";
    edit.addEventListener("click", () => mountPowerupForm(p.id, courseId, () => reapplyPowerups(courseId)));

    card.append(top, desc, edit);
    list.appendChild(card);
  });
}

function mountPowerupForm(id, courseId, afterChange) {
  const p = powerupList().find((p) => p.id === id);
  if (!p) return;
  const panel = panelShell("Configure \u00b7 " + p.name, null);
  const meta = p;
  const form = document.createElement("div");
  form.style.cssText = "display: flex; flex-direction: column; gap: 12px;";
  const config = getConfig(id) || Object.fromEntries(meta.fields.map((f) => [f.key, f.default]));
  const commit = (key, value) => {
    config[key] = value;
    setConfig(id, { ...config });
    afterChange && afterChange();
  };

  meta.fields.forEach((f) => {
    if (f.type === "text") textInput(form, f.label, config[f.key] ?? "", (v) => commit(f.key, v));
    else if (f.type === "textarea") textareaField(form, f.label, config[f.key] ?? "", (v) => commit(f.key, v), 4);
    else if (f.type === "toggle") toggleField(form, f.label, !!config[f.key], (v) => commit(f.key, v));
    else if (f.type === "number") numberField(form, f.label, config[f.key] ?? "", (v) => commit(f.key, Number(v)), f);
    else if (f.type === "select") selectField(form, f.label, f.options, config[f.key] ?? f.default, (v) => commit(f.key, v));
    else if (f.type === "color") colorField(form, f.label, config[f.key] ?? f.default, (v) => commit(f.key, v));
  });

  const save = document.createElement("rf-button");
  save.setAttribute("kind", "primary");
  save.setAttribute("block", "");
  save.textContent = "Save & close";
  save.addEventListener("click", () => panel.close());
  const actions = document.createElement("div");
  actions.style.cssText = "margin-top: 14px;";
  actions.appendChild(save);

  panel.body.append(form, actions);
}

function reapplyPowerups(courseId) {
  refluxCleanups();
  applyEnabledPowerups(courseId);
}

let cleanups = [];
function refluxCleanups() {
  (cleanups || []).forEach((fn) => fn && fn());
  cleanups = [];
}

export function mountEditorShell() {
  if (document.getElementById(HOST_ID)) return;
  const host = ensureHost();

  const store = new BlockStore();

  const assistantBtn = fab("Assistant", "ink");
  const powerupsBtn = fab("Powerups", "violet");
  const modsBtn = fab("Mods", "white");
  const blocksBtn = fab("Blocks", "white");

  const shown = { assistant: false, powerups: false, mods: false, blocks: false };

  assistantBtn.addEventListener("click", () => {
    import("../../pages/assistant/assistant-app.js").then((m) => m.mountAssistant());
  });

  powerupsBtn.addEventListener("click", () => {
    const { body, close } = panelShell("Powerups", () => (shown.powerups = false));
    mountPowerups(body, store.courseId);
    shown.powerups = true;
  });

  modsBtn.addEventListener("click", () => {
    const { body, close } = panelShell("Mods", () => (shown.mods = false));
    mountModsPanel(body, store.courseId, () => {});
    shown.mods = true;
  });

  blocksBtn.addEventListener("click", () => {
    const { body, close } = panelShell("Block Library", () => (shown.blocks = false));
    mountLibrary(body, store, null);
    shown.blocks = true;
  });

  host.append(assistantBtn, powerupsBtn, modsBtn, blocksBtn);

  cleanups = applyEnabledPowerups(store.courseId);
  window.addEventListener("riseforge:powerups-changed", () => reapplyPowerups(store.courseId));
}