import { applyEnabledPowerups } from "../../powerups/index.js";
import { getConfig } from "../../powerups/registry.js";

export function mountViewer() {
  const applied = applyEnabledPowerups("published");
  window.addEventListener("riseforge:powerups-changed", () => {
    (applied.cleanups || []).forEach((fn) => fn && fn());
    const next = applyEnabledPowerups("published");
    applied.cleanups = next.cleanups;
  });

  const title = getConfig("published-title");
  if (title && title.title) document.title = title.title;

  try {
    const splash = document.createElement("div");
    splash.setAttribute("data-riseforge-viewer", "armed");
    document.documentElement.appendChild(splash);
  } catch {
    /* n/a */
  }
}