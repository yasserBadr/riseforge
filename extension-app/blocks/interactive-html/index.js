import { textInput, textareaField, numberField, toggleField } from "../shared/form-helper.js";
import { extUrl } from "../../core/ext-url.js";

export const meta = {
  id: "interactive-html",
  name: "Interactive HTML",
  description: "Fully custom HTML/CSS/JS block with SDK tracking and state.",
  icon: "E",
  category: "Custom",
  defaultConfig: {
    title: "Interactive",
    html: "",
    css: "",
    js: "",
    height: 340,
    sdkEnabled: true,
  },
};

export function builder(root, config, onChange) {
  textInput(root, "Title", config.title, (v) => onChange({ title: v }));
  numberField(root, "Height (px)", config.height, (v) => onChange({ height: Number(v) }), { min: 180, max: 800, step: 20 });
  toggleField(root, "Enable SDK (state, tracking, host messaging)", config.sdkEnabled, (v) => onChange({ sdkEnabled: v }));
  textareaField(root, "HTML", config.html, (v) => onChange({ html: v }), 6);
  textareaField(root, "CSS", config.css, (v) => onChange({ css: v }), 4);
  textareaField(root, "JavaScript", config.js, (v) => onChange({ js: v }), 5);
}

export function viewer(root, config, host) {
  const wrap = document.createElement("div");
  wrap.style.cssText =
    "border:1px solid #e2e4ee;border-radius:14px;overflow:hidden;box-shadow:0 12px 32px rgba(28,30,38,.08);";

  const title = document.createElement("div");
  title.style.cssText =
    "padding:10px 16px;background:#f6f7fb;border-bottom:1px solid #e2e4ee;font:600 13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:#1c1e26;display:flex;align-items:center;gap:8px;";
  const dot = document.createElement("span");
  dot.style.cssText =
    "width:8px;height:8px;border-radius:50%;background:#6d5df6;flex:none;";
  title.append(dot, config.title || "Interactive HTML");
  wrap.appendChild(title);

  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "width:100%;height:" + config.height + "px;border:none;display:block;transition:height .18s ease;";
  iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox");
  wrap.appendChild(iframe);

  const sdkScript = config.sdkEnabled
    ? "<script src='" + extUrl("sdk/forge-interactive-sdk.js") + "' data-rf-sdk></script>"
    : "";

  const doc = [
    "<!DOCTYPE html><html><head><style>*{box-sizing:border-box;}</style><style>",
    config.css || "",
    "</style>",
    sdkScript,
    "</head><body>",
    config.html || "",
    "<script>",
    "window.addEventListener('riseforge:interactive-ready',function(){console.log('[rf-sdk] interactive-ready');});",
    config.js || "",
    "</script></body></html>",
  ].join("");

  root.appendChild(wrap);
  iframe.srcdoc = doc;

  let frameState = {};
  const onFrameMessage = (event) => {
    if (event.source !== iframe.contentWindow) return;
    const data = event.data;
    if (!data || data.source !== "riseforge-sdk") return;
    const respond = (type, payload) => {
      try {
        iframe.contentWindow.postMessage(
          { source: "riseforge-host", type, payload: payload || {} },
          "*"
        );
      } catch {
        /* iframe navigated away */
      }
    };
    switch (data.type) {
      case "ready":
        respond("state", frameState);
        break;
      case "height":
        iframe.style.height = (data.payload.height || config.height) + "px";
        break;
      case "state.get":
        respond("state", frameState);
        break;
      case "state.set":
        if (data.payload.replace) frameState = data.payload.state;
        else Object.assign(frameState, data.payload.state || {});
        break;
      case "track":
        if (host && host.track) host.track("interactive-html.sdk", data.payload);
        break;
      case "complete":
        if (host && host.onComplete) host.onComplete();
        break;
      case "message.to-host":
        window.dispatchEvent(
          new CustomEvent("riseforge-interactive-message-to-host-event", {
            detail: {
              blockId: wrap.dataset.blockId,
              messageType: data.payload.messageType,
              payload: data.payload.payload,
            },
          })
        );
        break;
      case "error":
        console.warn("[riseforge] interactive block error:", data.payload.message);
        break;
      case "reload":
        iframe.srcdoc = doc;
        break;
      default:
        break;
    }
  };
  window.addEventListener("message", onFrameMessage, false);

  if (host && host.track) {
    host.track("interactive-html.rendered", { title: config.title, sdk: !!config.sdkEnabled });
  }
  const cleanup = () => window.removeEventListener("message", onFrameMessage, false);
  if (host && host.onUnmount) host.onUnmount(cleanup);
}