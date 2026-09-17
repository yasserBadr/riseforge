(() => {
  try {
    const el = document.createElement("riseforge-extension-installed");
    el.dataset.version = chrome.runtime.getManifest().version;
    document.documentElement.appendChild(el);
    window.dispatchEvent(
      new CustomEvent("riseforge:extension-installed", {
        detail: { version: chrome.runtime.getManifest().version },
      })
    );
  } catch {
    /* host page already has a signal; ignore */
  }
})();