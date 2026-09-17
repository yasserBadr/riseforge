import { textInput, numberField } from "../shared/form-helper.js";

export const meta = {
  id: "image-comparison",
  name: "Image Comparison",
  description: "Side-by-side image comparison slider.",
  icon: "I",
  category: "Interactive",
  defaultConfig: {
    labelA: "Before",
    labelB: "After",
    imageA: "",
    imageB: "",
    initialPosition: 50,
    height: 420,
  },
};

export function builder(root, config, onChange) {
  textInput(root, "Label A (left)", config.labelA, (v) => onChange({ labelA: v }));
  textInput(root, "Label B (right)", config.labelB, (v) => onChange({ labelB: v }));
  textInput(root, "Image URL A", config.imageA, (v) => onChange({ imageA: v }));
  textInput(root, "Image URL B", config.imageB, (v) => onChange({ imageB: v }));
  numberField(root, "Initial slider position (%)", config.initialPosition, (v) => onChange({ initialPosition: Number(v) }), {
    min: 0,
    max: 100,
    step: 5,
  });
  numberField(root, "Viewer height (px)", config.height, (v) => onChange({ height: Number(v) }), { min: 180, max: 800, step: 20 });
}

export function viewer(root, config, host) {
  const wrap = document.createElement("div");
  wrap.style.cssText =
    "position:relative;overflow:hidden;border-radius:14px;border:1px solid #e2e4ee;box-shadow:0 12px 32px rgba(28,30,38,.08);";
  wrap.style.height = config.height + "px";

  const setOverlayWidth = (pct) => {
    overlay.style.width = pct + "%";
    divider.style.left = pct + "%";
  };

  const imgA = document.createElement("img");
  imgA.src = config.imageA || "https://placehold.co/1200x800/e2e4ee/1c1e26?text=" + encodeURIComponent(config.labelA);
  imgA.alt = config.labelA;
  imgA.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;user-select:none;";
  wrap.appendChild(imgA);

  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:absolute;top:0;left:0;bottom:0;width:" + config.initialPosition + "%;overflow:hidden;";
  const imgB = document.createElement("img");
  imgB.src = config.imageB || "https://placehold.co/1200x800/6d5df6/fff?text=" + encodeURIComponent(config.labelB);
  imgB.alt = config.labelB;
  imgB.style.cssText = "position:absolute;inset:0;width:" + (100 / (config.initialPosition / 100)) + "px;height:100%;object-fit:cover;user-select:none;";
  overlay.appendChild(imgB);
  wrap.appendChild(overlay);

  const divider = document.createElement("div");
  divider.style.cssText =
    "position:absolute;top:0;bottom:0;width:3px;background:#fff;box-shadow:0 0 8px rgba(0,0,0,.3);left:" +
    config.initialPosition +
    "%;cursor:col-resize;z-index:2;";
  const knob = document.createElement("div");
  knob.style.cssText =
    "width:36px;height:36px;border-radius:50%;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.2);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;display:flex;align-items:center;justify-content:center;font-size:15px;color:#565a6b;";
  knob.textContent = "\u2194";
  divider.appendChild(knob);
  wrap.appendChild(divider);

  let dragging = false;
  const onMove = (e) => {
    if (!dragging) return;
    const rect = wrap.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setOverlayWidth(pct);
    imgB.style.width = (100 / (pct / 100)) + "px";
  };
  const onUp = () => {
    dragging = false;
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    document.removeEventListener("touchmove", onMove);
    document.removeEventListener("touchend", onUp);
  };
  divider.addEventListener("mousedown", () => {
    dragging = true;
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
  divider.addEventListener("touchstart", () => {
    dragging = true;
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onUp);
  });

  const labelsWrap = document.createElement("div");
  labelsWrap.style.cssText =
    "position:absolute;bottom:12px;left:0;right:0;display:flex;justify-content:space-between;padding:0 16px;pointer-events:none;";
  for (const label of [config.labelA, config.labelB]) {
    const tag = document.createElement("span");
    tag.style.cssText =
      "background:rgba(0,0,0,.55);color:#fff;padding:4px 10px;border-radius:7px;font:500 13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;pointer-events:none;";
    tag.textContent = label;
    labelsWrap.appendChild(tag);
  }
  wrap.appendChild(labelsWrap);
  root.appendChild(wrap);
}