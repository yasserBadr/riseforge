export function extUrl(relPath) {
  const base = document.documentElement.getAttribute("data-rf-ext-url");
  if (base) return base + relPath;
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) {
    return chrome.runtime.getURL(relPath);
  }
  return relPath;
}