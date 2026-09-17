import { register, getConfig } from "./registry.js";
import * as customCode from "./custom-code/index.js";
import * as findReplace from "./find-replace/index.js";
import * as globalStyles from "./global-styles/index.js";
import * as publishedTitle from "./published-title/index.js";
import * as translations from "./translations/index.js";

const powerups = [customCode, findReplace, globalStyles, publishedTitle, translations];

export function registerAllPowerups() {
  powerups.forEach((p) => register({ id: p.meta.id, name: p.meta.name, description: p.meta.description }));
}

export function applyEnabledPowerups(courseId) {
  const cleanups = [];
  powerups.forEach((p) => {
    if (!p.apply) return;
    const config = getConfig(p.meta.id);
    try {
      const result = p.apply(config || p.meta.defaultConfig, courseId);
      if (result && result.cleanups) cleanups.push(...result.cleanups);
    } catch (err) {
      console.error(`[riseforge] powerup "${p.meta.id}" apply failed`, err);
    }
  });
  return cleanups;
}

export function powerupList() {
  return powerups.map((p) => p.meta);
}