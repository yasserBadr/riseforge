const cache = new Map();
const pending = new Map();

async function area() {
  return chrome.storage.local;
}

async function getValue(key) {
  const val = cache.get(key);
  if (val !== undefined) return val;
  if (pending.has(key)) return pending.get(key);
  const p = area()
    .then((s) => s.get(key))
    .then((obj) => {
      const v = obj[key];
      cache.set(key, v);
      return v;
    })
    .finally(() => pending.delete(key));
  pending.set(key, p);
  return p;
}

async function setValue(key, value) {
  cache.set(key, value);
  const store = await area();
  await store.set({ [key]: value });
}

async function removeValue(key) {
  cache.delete(key);
  const store = await area();
  await store.remove(key);
}

export const storage = Object.freeze({
  get: getValue,
  set: setValue,
  remove: removeValue,
  async getMany(keys) {
    const entries = await area().then((s) => s.get(keys));
    keys.forEach((k) => {
      const v = entries[k];
      if (v !== undefined) cache.set(k, v);
    });
    return keys.map((k) => entries[k]);
  },
  clearCache() {
    cache.clear();
  },
});

export const localContext = new WeakMap();