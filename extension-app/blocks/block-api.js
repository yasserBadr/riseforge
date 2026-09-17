const COURSE_KEY_PREFIX = "rf:course:";

function courseKey(courseId) {
  return COURSE_KEY_PREFIX + (courseId || "local");
}

function serializeCourseId() {
  const m = location.pathname.match(/([A-Za-z0-9_-]{8,})\//);
  return m ? m[1] : "local";
}

export function getStorage() {
  return window.localStorage || { getItem() { return null; }, setItem() {}, removeItem() {} };
}

export class BlockStore {
  constructor(courseId) {
    this.courseId = courseId || serializeCourseId();
    this.key = courseKey(this.courseId);
    this.cache = null;
  }

  read() {
    if (this.cache) return this.cache;
    try {
      this.cache = JSON.parse(getStorage().getItem(this.key) || "{}");
    } catch {
      this.cache = {};
    }
    return this.cache;
  }

  write() {
    getStorage().setItem(this.key, JSON.stringify(this.cache || {}));
    this.emit("blocks-changed", this.cache);
  }

  emit(event, payload) {
    window.dispatchEvent(new CustomEvent(`riseforge:${event}`, { detail: payload }));
  }

  subscribe(fn) {
    const h = (e) => fn(e.detail);
    window.addEventListener("riseforge:blocks-changed", h);
    return () => window.removeEventListener("riseforge:blocks-changed", h);
  }

  list() {
    return Object.values(this.read());
  }

  get(blockId) {
    return this.read()[blockId] || null;
  }

  upsert(block) {
    const all = this.read();
    all[block.id] = block;
    this.write();
    return block;
  }

  remove(blockId) {
    const all = this.read();
    if (all[blockId]) {
      delete all[blockId];
      this.write();
    }
  }

  bump(blockId) {
    const b = this.get(blockId);
    if (b) {
      b.updatedAt = Date.now();
      this.upsert(b);
    }
    return b;
  }
}

export function createBlock(id, type, config) {
  return {
    id,
    type,
    config: config || {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function applyToRise(action, payload) {
  const ev = new CustomEvent("riseforge:rise-action", {
    detail: { action, payload },
  });
  window.dispatchEvent(ev);
  return ev;
}