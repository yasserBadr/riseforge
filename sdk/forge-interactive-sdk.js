(function (global) {
  "use strict";

  if (global.ForgeInteractive) return;

  const SOURCE = "riseforge-sdk";
  const origin = window.location.origin;
  const isHost = global === global.parent;

  const callbacks = { message: [], stateGet: [] };
  let href = origin === "null" ? "*" : origin;

  function post(type, payload) {
    const data = { source: SOURCE, type, payload: payload || {} };
    try {
      global.parent.postMessage(data, href);
    } catch {
      global.parent.postMessage(data, "*");
    }
  }

  window.addEventListener("message", function (event) {
    const data = event.data;
    if (!data || data.source !== "riseforge-host") return;
    switch (data.type) {
      case "state":
        callbacks.stateGet.forEach((cb) => {
          try {
            cb(structuredClone ? structuredClone(data.payload) : data.payload);
          } catch (e) {
            /* skip bad callback */
          }
        });
        break;
      case "message":
        callbacks.message.forEach((cb) => {
          try {
            cb(data.payload && data.payload.messageType, data.payload && data.payload.payload);
          } catch (e) {
            /* skip bad callback */
          }
        });
        break;
      default:
        break;
    }
  });

  const sdk = {
    version: "1.0.0",
    ready() {
      post("ready", { ts: Date.now() });
    },
    reportHeight(height) {
      const h = height || Math.ceil(document.body.scrollHeight || 0);
      post("height", { height: h });
      return h;
    },
    setState(state, opts) {
      const replace = !!(opts && opts.replace);
      post("state.set", { state, replace });
    },
    getState(cb) {
      callbacks.stateGet = callbacks.stateGet.concat(cb);
      post("state.get", {});
      return () => {
        const i = callbacks.stateGet.indexOf(cb);
        if (i > -1) callbacks.stateGet.splice(i, 1);
      };
    },
    track(payload) {
      post("track", payload || {});
    },
    complete() {
      post("complete", {});
    },
    error(err) {
      post("error", { message: err && err.message ? err.message : String(err) });
    },
    sendToHost(messageType, payload) {
      post("message.to-host", { messageType, payload });
    },
    onMessage(cb) {
      callbacks.message = callbacks.message.concat(cb);
      return () => {
        const i = callbacks.message.indexOf(cb);
        if (i > -1) callbacks.message.splice(i, 1);
      };
    },
    requestReload() {
      post("reload", {});
    },
    isHost,
  };

  global.ForgeInteractive = Object.freeze(sdk);

  document.addEventListener("DOMContentLoaded", function once() {
    try {
      sdk.ready();
      sdk.reportHeight();
      window.addEventListener("resize", () => sdk.reportHeight());
      window.dispatchEvent(
        new CustomEvent("riseforge:interactive-ready", { detail: { sdk } })
      );
    } catch (e) {
      /* sdk boot best-effort */
    }
  });
})(window);