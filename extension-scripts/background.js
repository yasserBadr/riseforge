const ENVIRONMENTS = {
  production: {
    id: "production",
    apiUrl: "https://api.riseforge.dev",
    appUrl: "https://riseforge.dev",
  },
  development: {
    id: "development",
    apiUrl: "http://localhost:8080",
    appUrl: "http://localhost:4200",
  },
};

const DEFAULT_ENV = "production";
const STORAGE_KEYS = { envId: "rf:envId", instanceId: "rf:instanceId" };

const INSTANCE_ID_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomId(length = 22) {
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    out += INSTANCE_ID_CHARS[bytes[i] % INSTANCE_ID_CHARS.length];
  }
  return out;
}

async function getEnv() {
  const { [STORAGE_KEYS.envId]: stored } = await chrome.storage.local.get(
    STORAGE_KEYS.envId
  );
  const envId = stored || DEFAULT_ENV;
  return ENVIRONMENTS[envId] || ENVIRONMENTS[DEFAULT_ENV];
}

async function getInstanceId() {
  const { [STORAGE_KEYS.instanceId]: id } = await chrome.storage.local.get(
    STORAGE_KEYS.instanceId
  );
  if (id) return id;
  const fresh = randomId();
  await chrome.storage.local.set({ [STORAGE_KEYS.instanceId]: fresh });
  return fresh;
}

function getRuntimeVersion() {
  return chrome.runtime.getManifest().version;
}

const telemetryQueue = [];
let telemetryTimer = null;

async function sendAnalyticEvent(name, payload = {}) {
  const env = await getEnv();
  const instanceId = await getInstanceId();
  telemetryQueue.push({
    name,
    payload,
    instanceId,
    extensionVersion: getRuntimeVersion(),
    env: env.id,
    ts: Date.now(),
  });
  if (telemetryTimer) return;
  telemetryTimer = setTimeout(() => {
    telemetryTimer = null;
    flushTelemetry(env).catch(() => {});
  }, 4000);
}

async function flushTelemetry(env) {
  if (!telemetryQueue.length) return;
  const batch = telemetryQueue.splice(0, telemetryQueue.length);
  const body = {
    events: batch,
    instanceId: batch[0].instanceId,
    extensionVersion: batch[0].extensionVersion,
  };
  telemetryQueue.length = 0;
  try {
    const res = await fetch(`${env.apiUrl}/api/v1/analytics`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok && batch.length < 3) telemetryQueue.unshift(...batch);
  } catch {
    if (batch.length < 3) telemetryQueue.unshift(...batch);
  }
}

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    sendAnalyticEvent("extension_installed").catch(() => {});
    chrome.storage.local.set({
      "rf:installedAt": Date.now(),
    });
  } else if (reason === "update") {
    sendAnalyticEvent("extension_updated").catch(() => {});
  }
  chrome.runtime.setUninstallURL("https://riseforge.dev/bye").catch(() => {});
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case "RF_GET_RUNTIME": {
      getEnv().then(async (env) => {
        const [instanceId, installedAt] = await Promise.all([
          getInstanceId(),
          chrome.storage.local.get("rf:installedAt").then((s) => s["rf:installedAt"] || null),
        ]);
        sendResponse({
          env,
          instanceId,
          installedAt,
          extensionVersion: getRuntimeVersion(),
        });
      });
      return true;
    }
    case "RF_TRACK": {
      sendAnalyticEvent(message.name, message.payload || {}).catch(() => {});
      sendResponse({ ok: true });
      return false;
    }
    default:
      return false;
  }
});