const mods = new Map();
export function register(mod) {
  mods.set(mod.id, mod);
}
export function getMod(id) {
  return mods.get(id);
}
export function allMods() {
  return [...mods.values()];
}
export function modsForBlock(blockType) {
  return [...mods.values()].filter((m) => m.appliesTo(blockType));
}