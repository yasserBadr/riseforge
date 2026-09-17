const runtime = (
  typeof chrome !== "undefined" && chrome.runtime
) ? chrome.runtime : null;

async function loadRuntimeInfo() {
  if (!runtime) {
    return {
      env: { id: "development", apiUrl: "http://localhost:8080", appUrl: "http://localhost:4200" },
      instanceId: "local",
      extensionVersion: "0.0.0",
      installedAt: null,
    };
  }
  return new Promise((resolve) => {
    runtime.sendMessage({ type: "RF_GET_RUNTIME" }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({
          env: { id: "development", apiUrl: "http://localhost:8080", appUrl: "http://localhost:4200" },
          instanceId: "local",
          extensionVersion: "0.0.0",
          installedAt: null,
        });
        return;
      }
      resolve(response || {});
    });
  });
}

let runtimeInfoPromise = null;
export function getRuntimeInfo() {
  if (!runtimeInfoPromise) runtimeInfoPromise = loadRuntimeInfo();
  return runtimeInfoPromise;
}

export async function track(name, payload) {
  if (!runtime) return { ok: true };
  return new Promise((resolve) => {
    runtime.sendMessage(
      { type: "RF_TRACK", name, payload: payload || {} },
      (response) => {
        if (chrome.runtime.lastError) resolve({ ok: false });
        else resolve(response || { ok: false });
      }
    );
  });
}

export const caps = Object.freeze({
  hasStorage: !!(runtime && chrome.storage && chrome.storage.local),
});