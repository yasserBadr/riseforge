const registry = new Map();

export const di = Object.freeze({
  provide(token, implementation) {
    if (registry.has(token)) {
      throw new Error(`DI: ${token} already provided`);
    }
    registry.set(token, implementation);
    return implementation;
  },

  override(token, implementation) {
    registry.set(token, implementation);
    return implementation;
  },

  get(token) {
    if (!registry.has(token)) {
      throw new Error(`DI: no provider for "${token}"`);
    }
    return registry.get(token);
  },

  has(token) {
    return registry.has(token);
  },

  reset() {
    registry.clear();
  },
});

export function isFunctionToken(token) {
  return typeof token === "function" || typeof token === "string";
}

export function singleton(factory) {
  let instance = null;
  return function () {
    if (!instance) instance = factory();
    return instance;
  };
}