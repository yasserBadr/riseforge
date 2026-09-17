import { register } from "./registry.js";

const MODS = [
  {
    id: "video-hide-controls",
    name: "Hide video controls",
    description: "Hides native video player controls in embedded videos.",
    appliesTo: (type) => /video|storyline|embedded/i.test(type),
    fields: [{ key: "hidden", label: "Hide controls", type: "toggle", default: true }],
    apply(container, config) {
      container.querySelectorAll("video").forEach((vid) => {
        vid.controls = !config.hidden;
        vid.setAttribute("controlsList", "nodownload");
        vid.style.pointerEvents = config.hidden ? "none" : "";
      });
    },
  },
  {
    id: "video-autoplay",
    name: "Autoplay video",
    description: "Automatically begins playback on scroll into view.",
    appliesTo: (type) => /video|storyline/i.test(type),
    fields: [{ key: "autoplays", label: "Autoplay", type: "toggle", default: true }],
    apply(container, config) {
      if (!config.autoplays) return;
      const videos = [...container.querySelectorAll("video")];
      if (!videos.length) return;
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            e.target.paused ? e.target.play().catch(() => {}) : e.target.pause();
          });
        },
        { threshold: 0.35 }
      );
      videos.forEach((v) => io.observe(v));
    },
  },
  {
    id: "audio-autoplay",
    name: "Autoplay audio",
    description: "Plays audio blocks automatically on page load.",
    appliesTo: (type) => /audio/i.test(type),
    fields: [{ key: "autoplay", label: "Autoplay", type: "toggle", default: false }],
    apply(container, config) {
      if (!config.autoplay) return;
      const audios = container.querySelectorAll("audio");
      audios.forEach((a) => a.play().catch(() => {}));
    },
  },
  {
    id: "audio-prevent-seek",
    name: "Prevent forward seeking",
    description: "Learners must listen sequentially; no skipping ahead.",
    appliesTo: (type) => /audio/i.test(type),
    fields: [{ key: "enabled", label: "Enforce sequential listening", type: "toggle", default: true }],
    apply(container, config) {
      if (!config.enabled) return;
      container.querySelectorAll("audio").forEach((audio) => {
        let maxTime = 0;
        audio.addEventListener("timeupdate", () => {
          if (audio.currentTime > maxTime + 0.5) {
            audio.currentTime = maxTime;
          }
          if (audio.currentTime > maxTime) maxTime = audio.currentTime;
        });
      });
    },
  },
  {
    id: "nav-hide-step-count",
    name: "Remove step count",
    description: "Removes the numeric step counter from navigation.",
    appliesTo: () => true,
    fields: [{ key: "remove", label: "Remove step counter", type: "toggle", default: true }],
    apply(container, config) {
      if (!config.remove) return;
      container.querySelectorAll('[class*="step-count"], [class*="StepCount"]').forEach((el) => {
        el.style.display = "none";
      });
    },
  },
  {
    id: "layout-button-radius",
    name: "Button border radius",
    description: "Overrides button corner rounding across the course.",
    appliesTo: (type) => /button|cta|navigation/i.test(type),
    fields: [{ key: "radius", label: "Radius (px)", type: "number", default: 10, min: 0, max: 40, step: 2 }],
    apply(container, config) {
      const px = (config.radius || 10) + "px";
      container.querySelectorAll("button, [role='button'], .btn, [class*='button']").forEach((el) => {
        el.style.borderRadius = px;
      });
    },
  },
  {
    id: "cards-border-radius",
    name: "Card corner radius",
    description: "Rounds card corners to a specific value.",
    appliesTo: (type) => /card|grid|flashcard/i.test(type),
    fields: [{ key: "radius", label: "Radius (px)", type: "number", default: 12, min: 0, max: 40, step: 2 }],
    apply(container, config) {
      const px = (config.radius || 12) + "px";
      container.querySelectorAll('[class*="card"], [class*="Card"]').forEach((el) => {
        el.style.borderRadius = px;
      });
    },
  },
  {
    id: "layout-column-spacing",
    name: "Column spacing override",
    description: "Overrides multi-column spacing.",
    appliesTo: (type) => /column|grid|split/i.test(type),
    fields: [{ key: "gap", label: "Column gap (px)", type: "number", default: 24, min: 0, max: 120, step: 4 }],
    apply(container, config) {
      const px = (config.gap || 24) + "px";
      container.querySelectorAll('[class*="column"], [class*="Column"]').forEach((el) => {
        el.style.gap = px;
      });
    },
  },
];

export function registerAllMods() {
  MODS.forEach((m) => register(m));
}