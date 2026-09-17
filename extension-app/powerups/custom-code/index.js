import { getConfig, setConfig, getEnabled, setEnabled } from "../registry.js";

const STORAGE_KEY = "rf:snippets";

function readSnippets(courseId) {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY + ":" + (courseId || "local")) || "[]");
  } catch { return []; }
}
function writeSnippets(snippets, courseId) {
  localStorage.setItem(STORAGE_KEY + ":" + (courseId || "local"), JSON.stringify(snippets));
}

export const meta = {
  id: "custom-code",
  name: "Custom Code",
  description: "Inject CSS and JavaScript snippets at course, lesson, or block level.",
  fields: [
    { key: "scope", label: "Scope", type: "select", options: ["course", "lesson", "cover", "block"], default: "course" },
  ],
};

export function init(courseId) {
  const snippets = readSnippets(courseId);
  return { snippets };
}

export function addSnippet(snippet, courseId) {
  const snippets = readSnippets(courseId);
  snippet.id = snippet.id || "snip-" + crypto.randomUUID().slice(0, 8);
  snippet.enabled = snippet.enabled !== false;
  snippet.name = snippet.name || "Untitled snippet";
  snippet.language = snippet.language || "css";
  snippet.scope = snippet.scope || "course";
  snippets.push(snippet);
  writeSnippets(snippets, courseId);
  return snippet;
}

export function updateSnippet(id, patch, courseId) {
  const snippets = readSnippets(courseId);
  const idx = snippets.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  Object.assign(snippets[idx], patch);
  writeSnippets(snippets, courseId);
  return snippets[idx];
}

export function deleteSnippet(id, courseId) {
  const snippets = readSnippets(courseId).filter((s) => s.id !== id);
  writeSnippets(snippets, courseId);
}

export function apply(courseId) {
  if (!getEnabled("custom-code")) return { cleanups: [] };
  const snippets = readSnippets(courseId).filter((s) => s.enabled);
  const cleanups = [];

  snippets.forEach((snippet) => {
    if (snippet.language === "css") {
      const style = document.createElement("style");
      style.dataset.rfSnippet = snippet.id;
      style.textContent = snippet.code || "";
      document.head.appendChild(style);
      cleanups.push(() => style.remove());
    } else {
      const script = document.createElement("script");
      script.dataset.rfSnippet = snippet.id;
      script.textContent = snippet.code || "";
      document.body.appendChild(script);
      cleanups.push(() => script.remove());
    }
  });

  return { cleanups };
}