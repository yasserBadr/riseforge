import { allMods, modsForBlock } from "../../mods/registry.js";
import { registerAllMods } from "../../mods/index.js";
import { textInput, numberField, toggleField } from "./form-helper.js";
import { toast } from "../../shared/components.js";

registerAllMods();

const KEY = (courseId) => "rf:mods:" + (courseId || "local");

function loadState(courseId) {
  try {
    return JSON.parse(localStorage.getItem(KEY(courseId)) || "{}");
  } catch {
    return {};
  }
}
function saveState(courseId, state) {
  localStorage.setItem(KEY(courseId), JSON.stringify(state));
}

function singleToggleRow(name, desc, active, onToggle) {
  const card = document.createElement("div");
  card.style.cssText = "border:1px solid #e2e4ee;border-radius:12px;padding:12px 14px;background:#fff;";
  const top = document.createElement("div");
  top.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:10px;";
  const left = document.createElement("div");
  const n = document.createElement("div");
  n.textContent = name;
  n.style.cssText = "font-weight:650;font-size:13.5px;color:#1c1e26;";
  const d = document.createElement("div");
  d.textContent = desc;
  d.style.cssText = "font-size:12px;color:#8a8fa3;margin-top:2px;";
  left.append(n, d);
  const toggle = document.createElement("rf-toggle");
  if (active) toggle.setAttribute("checked", "");
  toggle.addEventListener("change", (e) => onToggle(e.detail.checked));
  top.append(left, toggle);
  card.appendChild(top);
  return card;
}

export function mountModsPanel(body, courseId, onApply) {
  const state = loadState(courseId);
  const intro = document.createElement("p");
  intro.textContent = "Tweak how Rise blocks look and behave. Changes apply to the current course pages.";
  intro.style.cssText = "font-size:13px;color:#565a6b;margin:0 0 14px;line-height:1.5;";
  body.appendChild(intro);

  const apply = () => {
    const config = { ...state };
    (config.active || []).forEach((id) => {
      const mod = allMods().find((m) => m.id === id);
      if (mod) {
        try {
          mod.apply(document.body, config.settings[id] || {});
        } catch {
          /* mod failed for this page */
        }
      }
    });
    onApply && onApply();
  };

  allMods().forEach((mod) => {
    const enabled = !!(state.active || []).includes(mod.id);
    const row = singleToggleRow(mod.name, mod.description, enabled, (on) => {
      state.active = state.active || [];
      const idx = state.active.indexOf(mod.id);
      if (on && idx === -1) {
        state.active.push(mod.id);
        state.settings = state.settings || {};
        state.settings[mod.id] = { name: mod.name };
        const settings = state.settings[mod.id];
        mod.fields.forEach((f) => {
          if (settings[f.key] === undefined && f.default !== undefined) settings[f.key] = f.default;
        });
        saveState(courseId, state);
        row.replaceWith(configuredRow(body, mod, state, courseId, apply));
        apply();
      } else if (!on && idx > -1) {
        state.active.splice(idx, 1);
        saveState(courseId, state);
        apply();
      }
      toast(on ? "Mod enabled" : "Mod disabled", on ? "success" : "info");
    });
    body.appendChild(row);
  });
}

function configuredRow(body, mod, state, courseId, apply) {
  const card = document.createElement("div");
  card.style.cssText = "border:1px solid #6d5df6;border-radius:12px;padding:12px 14px;background:rgba(109,93,246,.04);";

  const top = document.createElement("div");
  top.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:10px;";
  const n = document.createElement("div");
  n.textContent = mod.name + " \u2014 on";
  n.style.cssText = "font-weight:650;font-size:13.5px;color:#1c1e26;";
  const toggle = document.createElement("rf-toggle");
  toggle.setAttribute("checked", "");
  toggle.addEventListener("change", (e) => {
    const on = e.detail.checked;
    state.active = state.active || [];
    const idx = state.active.indexOf(mod.id);
    if (on && idx === -1) state.active.push(mod.id);
    if (!on && idx > -1) state.active.splice(idx, 1);
    saveState(courseId, state);
    apply();
    if (!on) {
      card.remove();
      toast("Mod disabled", "info");
    }
  });
  top.append(n, toggle);
  card.appendChild(top);

  const settings = state.settings[mod.id] || {};
  const form = document.createElement("div");
  form.style.cssText = "margin-top:10px;display:flex;flex-direction:column;gap:10px;";
  mod.fields.forEach((f) => {
    if (f.type === "toggle") {
      toggleField(form, f.label, !!settings[f.key], (v) => {
        settings[f.key] = v;
        saveState(courseId, state);
        apply();
      });
    } else if (f.type === "number") {
      numberField(form, f.label, settings[f.key] ?? f.default ?? 0, (v) => {
        settings[f.key] = v;
        saveState(courseId, state);
        apply();
      }, f);
    } else {
      textInput(form, f.label, settings[f.key] ?? f.default ?? "", (v) => {
        settings[f.key] = v;
        saveState(courseId, state);
        apply();
      });
    }
  });

  card.appendChild(form);
  body.appendChild(card);
  return card;
}