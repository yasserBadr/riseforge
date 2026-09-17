const dom = window;

export const bus = Object.freeze({
  emit(event, payload) {
    dom.dispatchEvent(new CustomEvent(`riseforge:${event}`, { detail: payload }));
  },

  on(event, handler) {
    const wrapped = (e) => handler(e.detail);
    dom.addEventListener(`riseforge:${event}`, wrapped);
    return () => dom.removeEventListener(`riseforge:${event}`, wrapped);
  },

  once(event, handler) {
    const off = this.on(event, (detail) => {
      off();
      handler(detail);
    });
    return off;
  },
});

export const NS_FLAG = "riseforge";
export const NS_EVENT = "riseforge:message";

export function postToPage(event, payload, nonce) {
  window.postMessage(
    { source: NS_FLAG, nonce, event, payload },
    location.origin === "null" ? "*" : location.origin
  );
}

export function listenFromPage(fn) {
  const handler = (e) => {
    if (e.source !== window) return;
    const data = e.data;
    if (!data || data.source !== NS_FLAG) return;
    fn(data);
  };
  window.addEventListener("message", handler, false);
  return () => window.removeEventListener("message", handler, false);
}