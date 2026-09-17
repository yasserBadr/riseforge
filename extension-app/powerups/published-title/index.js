import { getEnabled } from "../registry.js";

export const meta = {
  id: "published-title",
  name: "Published Title",
  description: "Override the published course title shown in the browser tab.",
  fields: [
    { key: "title", label: "Tab title", type: "text", default: "" },
  ],
};

let appliedTitle = null;

export function apply(config) {
  if (!getEnabled("published-title") || !config.title) return { cleanups: [] };

  const prev = document.title;
  appliedTitle = config.title;
  document.title = config.title;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      if (m.type === "childList" && m.target === document.head && appliedTitle) {
        if (document.title !== appliedTitle) document.title = appliedTitle;
      }
    });
  });
  observer.observe(document.head, { childList: true, subtree: true });

  return {
    cleanups: [() => observer.disconnect(), () => (document.title = prev || "")],
  };
}