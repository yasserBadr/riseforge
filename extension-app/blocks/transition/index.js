import { selectField, textInput, colorField } from "../shared/form-helper.js";

export const meta = {
  id: "transition",
  name: "Transition",
  description: "Visual divider or separator between lessons.",
  icon: "T",
  category: "Layout",
  defaultConfig: {
    kind: "divider",
    text: "",
    color: "#e2e4ee",
    height: 60,
  },
};

const KINDS = ["divider", "spacer", "quote"];

export function builder(root, config, onChange) {
  selectField(root, "Style", KINDS, config.kind, (v) => onChange({ kind: v }));
  if (config.kind === "quote") {
    textInput(root, "Quote text", config.text, (v) => onChange({ text: v }));
  }
  colorField(root, "Color", config.color, (v) => onChange({ color: v }));
}

export function viewer(root, config) {
  const el = document.createElement("div");
  if (config.kind === "spacer") {
    el.style.cssText = "height:" + config.height + "px;";
  } else if (config.kind === "quote") {
    el.style.cssText =
      "padding:24px 0;font:italic 18px/1.6 Georgia,serif;color:#565a6b;text-align:center;border-top:1px solid " +
      config.color +
      ";border-bottom:1px solid " +
      config.color +
      ";";
    el.textContent = "\u201C" + config.text + "\u201D";
  } else {
    el.style.cssText =
      "display:flex;align-items:center;height:" + config.height + "px;";
    const line = document.createElement("div");
    line.style.cssText = "flex:1;height:2px;background:" + config.color + ";border-radius:1px;";
    const diamond = document.createElement("div");
    diamond.style.cssText =
      "width:10px;height:10px;background:" + config.color + ";transform:rotate(45deg);flex:none;margin:0 14px;";
    el.append(line, diamond, line.cloneNode());
  }
  root.appendChild(el);
}