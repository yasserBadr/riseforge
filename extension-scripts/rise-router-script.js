(() => {
  if (window.__rfRouterInstalled__) return;
  window.__rfRouterInstalled__ = true;

  const NS = "riseforge";
  const NONCE_ATTR = "data-rf-nonce";
  const BOOT_ATTR = "data-rf-bootstrap-type";
  const CLEAR_KNOWN_TYPES = Object.freeze([
    "authoring",
    "preview",
    "share",
    "theme",
    "publish",
    "export",
    "review",
    "unknown",
  ]);

  const ROUTE_PATTERNS = [
    { type: "blocks", re: /\/authoring\/([A-Za-z0-9_-]+)\/blocks/ },
    { type: "block-edit", re: /\/authoring\/([A-Za-z0-9_-]+)\/blocks\/([A-Za-z0-9_-]+)\/edit/ },
    { type: "course", re: /\/authoring\/([A-Za-z0-9_-]+)\/course/ },
    { type: "theme", re: /\/authoring\/([A-Za-z0-9_-]+)\/theme/ },
    { type: "author-preview", re: /\/authoring\/([A-Za-z0-9_-]+)\/preview/ },
    { type: "preview-course", re: /\/preview\/course/ },
    { type: "preview-blocks", re: /\/preview\/blocks/ },
    { type: "share-blocks", re: /\/share\/?/ },
    { type: "quick-share", re: /\/authoring\/([A-Za-z0-9_-]+)\/share/ },
    { type: "export-course", re: /\/export\/course/ },
    { type: "download-export", re: /\/export\/(pdf|raw|web|lms)/ },
    { type: "publish-review", re: /\/publish\/review/ },
    { type: "publish-reach", re: /\/publish\// },
    { type: "review", re: /\/review\/([A-Za-z0-9_-]+)/ },
    { type: "unknown", re: /.*/ },
  ];

  function detectRoute() {
    const href = location.href;
    for (const { type, re } of ROUTE_PATTERNS) {
      if (re.test(href)) return type;
    }
    return "unknown";
  }

  function isEditorRoute(type) {
    return /^(course|blocks|block-edit|theme|author-preview|export-course|download-export|quick-share)$/.test(
      type
    );
  }

  function isViewerRoute(type) {
    return /^(preview-course|preview-blocks|share-blocks|publish-review|publish-reach|review)$/.test(
      type
    );
  }

  const routeType = detectRoute();
  const wantsEditor = isEditorRoute(routeType);
  const wantsViewer = isViewerRoute(routeType);

  const docReady = () =>
    document.readyState !== "loading"
      ? Promise.resolve()
      : new Promise((res) => document.addEventListener("DOMContentLoaded", res, { once: true }));

  function ensureBootTarget(type) {
    let root = document.documentElement;
    root.setAttribute(NONCE_ATTR, root.getAttribute(NONCE_ATTR) || crypto.randomUUID());
    root.setAttribute(BOOT_ATTR, type);
    return root.getAttribute(NONCE_ATTR);
  }

  function findOrCreateHost() {
    let host = document.getElementById("rf-host");
    if (host) return host;
    host = document.createElement("div");
    host.id = "rf-host";
    host.style.cssText = "all: initial; position: fixed; inset: 0 auto auto 0; width: 0; height: 0; z-index: 2147483000;";
    (document.body || document.documentElement).appendChild(host);
    return host;
  }

  async function injectRuntime(bootstrapType) {
    const nonce = ensureBootTarget(bootstrapType);
    const root = document.documentElement;
    if (root.querySelector(`script[data-rf-runtime="${bootstrapType}"]`)) return nonce;
    const script = document.createElement("script");
    script.type = "module";
    script.dataset.rfRuntime = bootstrapType;
    script.src = chrome.runtime.getURL("extension-app/runtime.js");
    (document.head || document.documentElement).appendChild(script);
    return nonce;
  }

  async function installStyles() {
    const root = document.documentElement;
    if (root.dataset.rfStyles === "1") return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.dataset.rfStyles = "1";
    link.href = chrome.runtime.getURL("extension-app/style/design-system.css");
    if (!root.dataset.rfStylesHook) {
      root.dataset.rfStylesHook = "1";
      const mountCss = document.createElement("style");
      mountCss.textContent = "#rf-host { all: initial; position: fixed; left: 0; top: 0; width: 0; height: 0; z-index: 2147483000; }";
      (document.head || document.documentElement).appendChild(mountCss);
    }
    (document.head || document.documentElement).appendChild(link);
    root.dataset.rfStyles = "1";
  }

  async function bootRoute() {
    await docReady();
    await installStyles();
    findOrCreateHost();
    document.documentElement.setAttribute("data-rf-ext-url", chrome.runtime.getURL(""));
    let injected = false;
    if (wantsEditor) {
      injected = true;
      await injectRuntime("editor");
    } else if (wantsViewer) {
      injected = true;
      await injectRuntime("viewer");
    }
    chrome.runtime.sendMessage({
      type: "RF_TRACK",
      name: "route_viewed",
      payload: { routeType, injected },
    }).catch(() => {});
  }

  bootRoute().catch(() => {});

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message && message.type === "RF_PING") {
      sendResponse({ ok: true, routeType });
      return false;
    }
    return false;
  });
})();