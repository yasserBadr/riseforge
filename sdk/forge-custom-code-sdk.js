(function (global) {
  "use strict";

  if (global.mightyCustomCodeSdk || global.forgeCustomCodeSdk) return;

  const EVENT_TO_IFRAME = "riseforge-interactive-message-from-host-event";
  const EVENT_TO_HOST = "riseforge-interactive-message-to-host-event";

  function emit(name, detail) {
    global.dispatchEvent(new CustomEvent(name, { detail }));
  }

  const sdk = {
    sendMessageToInteractive(blockId, messageType, payload, targetWindow) {
      emit(EVENT_TO_IFRAME, {
        blockId,
        messageType,
        payload,
        target: targetWindow || global,
      });
      return true;
    },

    onMessageFromInteractive(messageType, callback) {
      const handler = (event) => {
        const detail = event.detail || {};
        if (messageType && detail.messageType !== messageType) return;
        callback(detail.payload, detail);
      };
      global.addEventListener(EVENT_TO_HOST, handler, false);
      return () => global.removeEventListener(EVENT_TO_HOST, handler, false);
    },
  };

  global.forgeCustomCodeSdk = Object.freeze(sdk);
  global.mightyCustomCodeSdk = sdk;
})(window);