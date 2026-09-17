import { getEnabled } from "../registry.js";

export const meta = {
  id: "translations",
  name: "Translations",
  description: "In-editor translations with billing-safe character tracking.",
  fields: [
    { key: "defaultLocale", label: "Default locale", type: "select", options: ["en-US", "es", "fr", "de", "pt-BR"], default: "en-US" },
  ],
};

const translateEndpoint = "/api/v1/translations/translate";

export function countCharacters(text) {
  return (text || "").length;
}

export async function localTranslate(text, targetLocale) {
  const ok = getEnabled("translations");
  if (!ok || !text) return text;
  const body = { text, targetLocale, sourceLocale: "en-US" };
  try {
    const res = await fetch(translateEndpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return text;
    const data = await res.json();
    return data.translated || text;
  } catch {
    return translateFallback(text, targetLocale);
  }
}

function translateFallback(text) {
  if (!window || !window.navigator || !navigator.language) return text;
  return text;
}

export function hasLocaleChanged(current, defaultLocale, translations) {
  const known = translations || {};
  return Object.keys(known).length > 0 && defaultLocale !== (known.default || defaultLocale);
}