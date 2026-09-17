const BOOT_ATTR = "data-rf-bootstrap-type";
const NONCE_ATTR = "data-rf-nonce";

const root = document.documentElement;
const bootstrapType = root.getAttribute(BOOT_ATTR) || "assistant";
const nonce = root.getAttribute(NONCE_ATTR) || crypto.randomUUID();

const NS = "riseforge";

export function getBootstrapType() {
  return bootstrapType;
}

export function postMessage(event, payload) {
  window.postMessage(
    { source: NS, nonce, event, payload },
    location.origin === "null" ? "*" : location.origin
  );
}

const CHUNKS = {
  editor: [
    { name: "editor-shell", load: () => import("./blocks/shared/editor-shell.js").then((m) => m.mountEditorShell()) },
  ],
  viewer: [{ name: "viewer-app", load: () => import("./pages/viewer/viewer-app.js").then((m) => m.mountViewer()) }],
  assistant: [{ name: "assistant-app", load: () => import("./pages/assistant/assistant-app.js").then((m) => m.mountAssistant({ mode: "sidebar" })) }],
};

export function boot() {
  const chunks = CHUNKS[bootstrapType] || CHUNKS.assistant;
  void (async () => {
    for (const chunk of chunks) {
      try {
        await chunk.load();
        window.dispatchEvent(
          new CustomEvent("riseforge:feature-loaded", {
            detail: { feature: chunk.name, bootstrapType },
          })
        );
      } catch (err) {
        console.error(`[riseforge] chunk "${chunk.name}" failed to load`, err);
      }
    }
  })();
}

boot();