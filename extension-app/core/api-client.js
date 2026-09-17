import { getRuntimeInfo } from "./telemetry.js";

const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);

export class ApiClient {
  constructor({ apiUrl } = {}) {
    this.apiUrl = apiUrl;
  }

  async url() {
    if (this.apiUrl) return this.apiUrl;
    const info = await getRuntimeInfo();
    return info.env.apiUrl;
  }

  async request(path, { method = "GET", body, headers = {}, retries = 2 } = {}) {
    const base = await this.url();
    const info = await getRuntimeInfo();
    let attempt = 0;
    for (;;) {
      try {
        const init = {
          method,
          headers: {
            "content-type": "application/json",
            "x-riseforge-version": info.extensionVersion,
            ...headers,
          },
        };
        if (body !== undefined) init.body = JSON.stringify(body);
        const res = await fetch(`${base}${path}`, init);
        if (res.ok) {
          const text = await res.text();
          return text ? JSON.parse(text) : null;
        }
        if (retries > 0 && RETRYABLE.has(res.status)) {
          attempt += 1;
          await delay(250 * attempt);
          retries -= 1;
          continue;
        }
        throw new ApiError(res.status, await res.text().catch(() => ""));
      } catch (err) {
        if (err instanceof ApiError && retries > 0) {
          retries -= 1;
          attempt += 1;
          await delay(250 * attempt);
          continue;
        }
        if (err instanceof ApiError) throw err;
        throw new ApiError(0, err.message || "network error");
      }
    }
  }

  get(path) {
    return this.request(path);
  }

  post(path, body) {
    return this.request(path, { method: "POST", body });
  }

  patch(path, body) {
    return this.request(path, { method: "PATCH", body });
  }
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms));