const _store = new Map();
const KEY = (courseId) => "rf:powerups:" + (courseId || "local");

function course() {
  const m = location.pathname.match(/([A-Za-z0-9_-]{8,})\//);
  return m ? m[1] : "local";
}

function loadAll() {
  const c = course();
  if (_store.has(c)) return _store.get(c);
  let data = {};
  try { data = JSON.parse(localStorage.getItem(KEY(c)) || "{}"); } catch { data = {}; }
  _store.set(c, data);
  return data;
}

function save() {
  const c = course();
  localStorage.setItem(KEY(c), JSON.stringify(loadAll()));
}

export function getConfig(id) {
  const all = loadAll();
  return all[id]?.config || null;
}

export function setConfig(id, config) {
  const all = loadAll();
  all[id] = { config, enabled: true };
  save();
}

export function getEnabled(id) {
  const all = loadAll();
  return all[id]?.enabled || false;
}

export function setEnabled(id, enabled) {
  const all = loadAll();
  if (!all[id]) all[id] = { config: {}, enabled };
  else all[id].enabled = enabled;
  save();
}

export function remove(id) {
  const all = loadAll();
  delete all[id];
  save();
}

const powerups = new Map();

export function register(p) {
  powerups.set(p.id, p);
}
export function get(id) {
  return powerups.get(id);
}
export function all() {
  return [...powerups.values()];
}