import * as multipleChoice from "./multiple-choice/index.js";
import * as imageComparison from "./image-comparison/index.js";
import * as reflection from "./reflection/index.js";
import * as reverseHotspot from "./reverse-hotspot/index.js";
import * as transition from "./transition/index.js";
import * as interactiveHtml from "./interactive-html/index.js";

export const BLOCKS = {
  "multiple-choice": multipleChoice,
  "image-comparison": imageComparison,
  reflection,
  "reverse-hotspot": reverseHotspot,
  transition,
  "interactive-html": interactiveHtml,
};

export const BLOCK_LIST = Object.values(BLOCKS).map((b) => ({
  id: b.meta.id,
  name: b.meta.name,
  description: b.meta.description,
  icon: b.meta.icon,
  category: b.meta.category,
}));

export function getBlock(id) {
  return BLOCKS[id];
}

export function defaultConfigOf(id) {
  const b = getBlock(id);
  return b ? structuredClone(b.meta.defaultConfig) : {};
}