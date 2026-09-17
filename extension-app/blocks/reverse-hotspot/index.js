import { textareaField, textInput, collect } from "../shared/form-helper.js";

export const meta = {
  id: "reverse-hotspot",
  name: "Reverse Hotspot",
  description: "Learner identifies labeled targets on an image.",
  icon: "H",
  category: "Interactive",
  defaultConfig: {
    prompt: "Can you locate each labeled target on the image?",
    image: "",
    targets: [
      { label: "Target A", x: 20, y: 30, radius: 40 },
      { label: "Target B", x: 70, y: 60, radius: 40 },
    ],
    height: 420,
  },
};

export function builder(root, config, onChange) {
  textareaField(root, "Prompt", config.prompt, (v) => onChange({ prompt: v }), 3);
  textInput(root, "Image URL", config.image, (v) => onChange({ image: v }));

  const labels = config.targets.map((t) => t.label);
  collect(root, "Targets (click-to-reveal labels)", labels.slice(), "Target label", (index, value) => {
    if (value === null) {
      const targets = config.targets.filter((_, i) => i !== index);
      onChange({ targets });
    } else {
      const targets = config.targets.map((t, i) => (i === index ? { ...t, label: value } : t));
      onChange({ targets });
    }
  });

  textInput(
    root,
    "Hotspot diameter (px)",
    String(config.targets[0] && config.targets[0].radius ? config.targets[0].radius : 40),
    (v) => {
      const radius = Number(v) || 40;
      onChange({ targets: config.targets.map((t) => ({ ...t, radius })) });
    }
  );
}

export function viewer(root, config, host) {
  const wrap = document.createElement("div");
  wrap.style.cssText =
    "position:relative;border-radius:14px;border:1px solid #e2e4ee;box-shadow:0 12px 32px rgba(28,30,38,.08);overflow:hidden;background:#f6f7fb;";
  wrap.style.height = config.height + "px";

  const prompt = document.createElement("div");
  prompt.style.cssText =
    "position:absolute;top:14px;left:14px;right:14px;z-index:3;background:rgba(255,255,255,.88);backdrop-filter:blur(10px);border-radius:10px;padding:10px 14px;font:500 14px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:#1c1e26;";
  prompt.textContent = config.prompt;
  wrap.appendChild(prompt);

  const img = document.createElement("img");
  img.src = config.image || "https://placehold.co/1200x800/e2e4ee/8a8fa3?text=Hotspot+Image";
  img.alt = "Hotspot image";
  img.style.cssText = "width:100%;height:100%;object-fit:cover;user-select:none;";
  wrap.appendChild(img);

  let found = 0;
  const targets = config.targets.map((target, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.style.cssText =
      "position:absolute;transform:translate(-50%,-50%);z-index:2;border-radius:50%;border:2px dashed rgba(109,93,246,.5);background:rgba(109,93,246,.12);cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;opacity:.45;font:600 11px/1 -apple-system,Segoe UI,Roboto,sans-serif;color:#6d5df6;overflow:hidden;";
    dot.style.left = target.x + "%";
    dot.style.top = target.y + "%";
    dot.style.width = (target.radius || 40) + "px";
    dot.style.height = (target.radius || 40) + "px";
    dot.title = "Click to reveal";
    dot.addEventListener("click", (e) => {
      e.stopPropagation();
      dot.style.background = "rgba(109,93,246,.85)";
      dot.style.border = "2px solid #6d5df6";
      dot.style.color = "#fff";
      dot.style.opacity = "1";
      dot.textContent = target.label;
      dot.style.fontSize = "11px";
      dot.style.pointerEvents = "none";
      dot.style.boxShadow = "0 4px 12px rgba(109,93,246,.35)";
      found += 1;
      if (host && host.track) {
        host.track("reverse-hotspot.found", { target: target.label, index, found, total: config.targets.length });
      }
      if (found === config.targets.length && host && host.onComplete) {
        host.onComplete();
      }
    });
    wrap.appendChild(dot);
    return dot;
  });

  root.appendChild(wrap);
}