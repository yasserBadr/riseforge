import { getConfig, setConfig, getEnabled, setEnabled } from "../registry.js";

export const meta = {
  id: "find-replace",
  name: "Find & Replace",
  description: "Search and replace text across all blocks in the course.",
  fields: [
    { key: "find", label: "Find", type: "text", default: "" },
    { key: "replace", label: "Replace with", type: "text", default: "" },
    { key: "caseSensitive", label: "Case sensitive", type: "toggle", default: false },
    { key: "wholeWord", label: "Whole word", type: "toggle", default: false },
  ],
};

let lastResults = [];

export function search(findText, options, courseBlocks) {
  if (!findText) return [];
  const flags = options.caseSensitive ? "g" : "gi";
  let pattern = findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (options.wholeWord) pattern = "\\b" + pattern + "\\b";
  const regex = new RegExp(pattern, flags);
  const results = [];

  (courseBlocks || []).forEach((block) => {
    const searchable = [block.config?.prompt, block.config?.text, block.config?.description]
      .filter(Boolean)
      .join(" ");
    if (regex.test(searchable)) {
      results.push({
        blockId: block.id,
        blockType: block.type,
        field: "content",
        matches: searchable.match(regex) || [],
      });
    }
    regex.lastIndex = 0;
  });

  lastResults = results;
  return results;
}

export function replace(findText, replaceText, options, courseBlocks) {
  if (!findText || !courseBlocks) return { replaced: 0 };
  const flags = options.caseSensitive ? "g" : "gi";
  let pattern = findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (options.wholeWord) pattern = "\\b" + pattern + "\\b";
  const regex = new RegExp(pattern, flags);
  let replaced = 0;

  courseBlocks.forEach((block) => {
    ["prompt", "text", "description"].forEach((field) => {
      if (block.config?.[field]) {
        const before = block.config[field];
        const after = before.replace(regex, replaceText);
        if (after !== before) {
          block.config[field] = after;
          replaced++;
        }
      }
    });
  });

  return { replaced, results: lastResults };
}

export function getResults() {
  return lastResults;
}