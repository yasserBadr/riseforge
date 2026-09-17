import "../../shared/components.js";
import "../../shared/components-input.js";
import { registerInputComponents } from "../../shared/components-input.js";
import { registerDisplayComponents } from "../../shared/components.js";

registerInputComponents();
registerDisplayComponents();

const MODES = ["popup", "sidebar"];
const state = {
  mode: location.hash.startsWith("#popup") ? "popup" : "sidebar",
  user: null,
  route: "home",
};

function storageBackend() {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    return {
      async get(k) {
        return new Promise((res) => chrome.storage.local.get(k, (o) => res(chrome.runtime.lastError ? null : (o || {})[k])));
      },
      async set(k, v) {
        return new Promise((res) => chrome.storage.local.set({ [k]: v }, () => res()));
      },
    };
  }
  return {
    async get(k) {
      try {
        return JSON.parse(localStorage.getItem("rf:" + k) || "null");
      } catch {
        return null;
      }
    },
    async set(k, v) {
      localStorage.setItem("rf:" + k, JSON.stringify(v));
    },
  };
}

const storev = storageBackend();

async function loadUser() {
  state.user = await storev.get("assistant.user");
  if (state.user && !state.user.name) {
    state.user.name = state.user.email ? state.user.email.split("@")[0] : "Rise author";
  }
}

const APP = "https://riseforge.dev";
const MENU = [
  { title: "Need help with your course?", description: "Ask a Rise expert", href: "https://riseforge.dev/help", external: true },
  { title: "Refer & Earn", description: "Get credits for referrals", route: "referral", badge: "NEW" },
  { title: "Mighty community", description: "Join the community", href: "https://riseforge.dev/community", external: true },
  { title: "Manage account", description: "Billing and settings", href: APP + "/account", external: true },
  { title: "Visit help center", description: "Docs and guides", href: "https://riseforge.dev/docs", external: true },
  { title: "Studio", description: "Interactive library", href: APP + "/studio", external: true },
  { title: "Report a bug", description: "Send a report", href: "https://riseforge.dev/bug", external: true },
];

function el(tag, text, style) {
  const n = document.createElement(tag);
  if (text) n.textContent = text;
  if (style) n.style.cssText = style;
  return n;
}

function shell(container, closable) {
  container.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.style.cssText =
    "display:flex;flex-direction:column;height:100%;background:#fff;font:14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c1e26;";
  const header = document.createElement("div");
  header.style.cssText =
    "display:flex;align-items:center;gap:10px;padding:16px 18px;border-bottom:1px solid #e2e4ee;";
  const logo = el("div", "RF", "width:32px;height:32px;border-radius:9px;background:#6d5df6;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;flex:none;");
  const brand = el("div", "RiseForge", "font-weight:700;font-size:15px;flex:1;");
  header.append(logo, brand);
  if (closable) {
    const close = el("button", "\u00d7", "border:none;background:#f0f1f7;width:28px;height:28px;border-radius:999px;cursor:pointer;font-size:17px;color:#565a6b;line-height:1;");
    close.addEventListener("click", () => hide());
    header.appendChild(close);
  }
  const body = document.createElement("div");
  body.style.cssText = "flex:1;overflow-y:auto;";
  wrap.append(header, body);
  container.appendChild(wrap);
  return body;
}

function menuItem(item) {
  const btn = document.createElement("button");
  btn.style.cssText =
    "display:flex;flex-direction:column;gap:2px;width:100%;text-align:left;cursor:pointer;border:1px solid #e2e4ee;border-radius:12px;background:#fff;padding:12px 14px;transition:border-color .12s,box-shadow .12s;";
  btn.addEventListener("mouseenter", () => {
    btn.style.borderColor = "#6d5df6";
    btn.style.boxShadow = "0 4px 14px rgba(109,93,246,.14)";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.borderColor = "#e2e4ee";
    btn.style.boxShadow = "none";
  });
  const titleRow = el("div", item.title, "font-size:13.5px;font-weight:650;color:#1c1e26;display:flex;align-items:center;gap:8px;");
  if (item.badge) {
    titleRow.appendChild(el("span", item.badge, "font-size:10px;font-weight:800;color:#1aa179;background:rgba(26,161,121,.12);border-radius:999px;padding:2px 7px;"));
  }
  const desc = el("div", item.description || "", "font-size:11.5px;color:#8a8fa3;");
  btn.append(titleRow, desc);
  btn.addEventListener("click", () => {
    if (item.route) navigate(item.route);
    else if (item.href) window.open(item.href, "_blank");
  });
  return btn;
}

function renderHome(body) {
  const user = state.user;
  if (!user) {
    navigate("login");
    return;
  }
  const hello = el("div", "Hi " + user.name, "font-size:18px;font-weight:700;padding:14px 18px 4px;color:#1c1e26;");
  body.appendChild(hello);
  const grid = el("div", null, "display:grid;grid-template-columns:1fr;gap:10px;padding:12px 18px 20px;");
  MENU.forEach((m) => grid.appendChild(menuItem(m)));
  body.appendChild(grid);
  const footer = document.createElement("div");
  footer.style.cssText = "padding:14px 18px;border-top:1px solid #e2e4ee;display:flex;justify-content:space-between;align-items:center;";
  const ver = el("span", "v1.0.0", "font-size:11px;color:#8a8fa3;");
  const out = document.createElement("button");
  out.textContent = "Sign out";
  out.style.cssText = "border:none;background:none;cursor:pointer;font-size:12px;color:#d9404c;font-weight:600;";
  out.addEventListener("click", async () => {
    await storev.set("assistant.user", null);
    state.user = null;
    navigate("login");
  });
  footer.append(ver, out);
  body.appendChild(footer);
}

function renderLogin(body) {
  const card = el("div", null, "padding:24px 20px;");
  const title = el("div", "Welcome to RiseForge", "font-size:18px;font-weight:700;margin-bottom:6px;");
  const tag = el("div", "Build fully custom blocks in Articulate Rise 360.", "font-size:13px;color:#565a6b;margin-bottom:20px;");
  card.appendChild(title);
  card.appendChild(tag);

  const input = document.createElement("rf-input");
  input.setAttribute("label", "Email");
  input.setAttribute("placeholder", "you@company.com");
  input.setAttribute("type", "text");
  card.appendChild(input);

  const btn = document.createElement("rf-button");
  btn.setAttribute("kind", "primary");
  btn.setAttribute("block", "");
  btn.textContent = "Continue";
  btn.style.cssText = "margin-top:14px;";
  btn.addEventListener("click", async () => {
    const email = input.value.trim();
    if (!email) {
      showToast("Enter an email to continue", "warning");
      return;
    }
    const user = { email, name: email.split("@")[0], trialEndsAt: Date.now() + 14 * 864e5 };
    await storev.set("assistant.user", user);
    state.user = user;
    navigate("home");
  });
  card.appendChild(btn);

  const fine = el("div", "Sign in is local-only in this build.", "font-size:11px;color:#8a8fa3;margin-top:14px;");
  card.appendChild(fine);
  body.appendChild(card);
}

function renderReferral(body) {
  const card = el("div", null, "padding:20px 18px;");
  const title = el("div", "Refer & Earn", "font-size:18px;font-weight:700;margin-bottom:16px;");
  card.appendChild(title);

  const email = document.createElement("rf-input");
  email.setAttribute("label", "Invite a friend");
  email.setAttribute("placeholder", "friend@email.com");
  card.appendChild(email);

  const send = document.createElement("rf-button");
  send.setAttribute("kind", "primary");
  send.setAttribute("block", "");
  send.textContent = "Send invite";
  send.style.cssText = "margin-top:12px;";
  send.addEventListener("click", () => {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value);
    showToast(valid ? "Invite sent. Thanks for sharing!" : "That email does not look right", valid ? "success" : "warning");
  });
  card.appendChild(send);

  const perq = el("div", "You get 1 month of RiseForge Plus after 3 friends sign up.", "font-size:12px;color:#565a6b;margin-top:14px;line-height:1.5;");
  card.appendChild(perq);
  body.appendChild(card);
}

function renderMaestro(body) {
  const card = el("div", null, "padding:20px 18px;");
  const title = el("div", "Rise course experts, at your fingertips.", "font-size:17px;font-weight:700;margin-bottom:6px;");
  const tag = el("div", "Pro learning designers can build, review, and polish your course.", "font-size:13px;color:#565a6b;margin-bottom:18px;");
  card.append(title, tag);
  const services = [
    "Custom interactions",
    "Design improvements",
    "Full course development",
    "Media, voice, and assets",
  ];
  services.forEach((s) => {
    const row = el("div", s, "display:flex;align-items:center;gap:9px;padding:10px 12px;border:1px solid #e2e4ee;border-radius:10px;margin-bottom:8px;font-size:13.5px;color:#1c1e26;");
    const dot = el("span", "", "width:8px;height:8px;border-radius:50%;background:#6d5df6;flex:none;");
    row.prepend(dot);
    card.appendChild(row);
  });
  const cta = document.createElement("rf-button");
  cta.setAttribute("kind", "primary");
  cta.setAttribute("block", "");
  cta.textContent = "Let's chat";
  cta.addEventListener("click", () => window.open(APP + "/maestro", "_blank"));
  card.appendChild(cta);
  body.appendChild(card);
}

function renderRoute(body) {
  body.innerHTML = "";
  if (state.route === "login") renderLogin(body);
  else if (state.route === "referral") renderReferral(body);
  else if (state.route === "maestro") renderMaestro(body);
  else renderHome(body);
}

function navigate(route) {
  state.route = route;
  markRoute();
}

let markRoute = () => {};

function showToast(message, tone) {
  const host = document.querySelector("riseforge-assistant");
  if (!host) return;
  try {
    let t = host.shadowRoot.querySelector("rf-toast-host") || host.shadowRoot.appendChild(document.createElement("rf-toast-host"));
    t.show(message, tone);
  } catch {
    /* popup mode: no shadow tree toast */
    const t = document.createTextNode(message);
    const b = host.shadowRoot || document;
  }
}

function createHost(closable) {
  const host = document.createElement("riseforge-assistant");
  host.attachShadow({ mode: "open" });
  const shadowStyle = document.createElement("style");
  shadowStyle.textContent =
    ":host{all:initial;font:14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c1e26;}\n" +
    "*{box-sizing:border-box;}\n" +
    "::-webkit-scrollbar{width:10px;height:10px;}::-webkit-scrollbar-thumb{background:#c9cddd;border-radius:8px;border:2px solid transparent;background-clip:content-box;}";
  host.shadowRoot.appendChild(shadowStyle);
  return host;
}

let mountedHost = null;

export function mountAssistant(opts) {
  const o = opts || {};
  if (state.mode === "popup" || o.mode === "popup") {
    mountPopup();
    return;
  }
  if (document.getElementById("riseforge-assistant-singleton")) {
    document.getElementById("riseforge-assistant-singleton").remove();
  }
  const backdrop = document.createElement("div");
  backdrop.id = "riseforge-assistant-backdrop";
  backdrop.style.cssText =
    "position:fixed;inset:0;z-index:2147483100;background:rgba(20,22,30,.35);opacity:0;transition:opacity .18s ease;";
  requestAnimationFrame(() => (backdrop.style.opacity = "1"));

  const drawer = document.createElement("div");
  drawer.id = "riseforge-assistant-singleton";
  drawer.style.cssText =
    "position:fixed;z-index:2147483150;top:14px;bottom:14px;right:14px;width:min(400px,92vw);" +
    "background:#fff;border-radius:16px;box-shadow:0 24px 60px rgba(20,22,30,.3);" +
    "display:flex;flex-direction:column;overflow:hidden;transform:translateX(24px);opacity:0;transition:transform .2s ease,opacity .2s ease;";
  requestAnimationFrame(() => {
    drawer.style.transform = "none";
    drawer.style.opacity = "1";
  });

  const host = createHost(true);
  host.shadowRoot.appendChild(drawer);
  document.body.appendChild(backdrop);
  document.body.appendChild(host);
  mountedHost = host;

  const closeBtn = el("button", "\u00d7", "position:absolute;top:12px;right:14px;z-index:5;border:none;background:#f0f1f7;width:30px;height:30px;border-radius:999px;cursor:pointer;font-size:18px;color:#565a6b;");
  closeBtn.addEventListener("click", hideAssistant);
  drawer.appendChild(closeBtn);

  backdrop.addEventListener("click", hideAssistant);
  document.addEventListener("keydown", onEsc, { once: true });

  loadUser().then(() => {
    const body = shell(drawer, false);
    markRoute = () => renderRoute(body);
    renderRoute(body);
  });
}

function onEsc(e) {
  if (e.key === "Escape") hideAssistant();
}

export function hideAssistant() {
  const drawer = document.getElementById("riseforge-assistant-singleton");
  const backdrop = document.getElementById("riseforge-assistant-backdrop");
  [drawer, backdrop].forEach((n) => n && (n.style.opacity = "0"));
  if (drawer) drawer.style.transform = "translateX(24px)";
  setTimeout(() => {
    [drawer, backdrop, mountedHost].forEach((n) => n && n.remove());
    mountedHost = null;
  }, 200);
  document.removeEventListener("keydown", onEsc);
}

export function mountPopup() {
  if (!document.body) {
    window.addEventListener("DOMContentLoaded", mountPopup, { once: true });
    return;
  }
  const host = createHost(false);
  const fill = document.createElement("div");
  fill.style.cssText = "position:fixed;inset:0;display:flex;flex-direction:column;background:#fff;";
  host.shadowRoot.appendChild(fill);
  document.body.appendChild(host);
  document.body.style.margin = "0";
  loadUser().then(() => {
    const body = shell(fill, false);
    markRoute = () => renderRoute(body);
    renderRoute(body);
  });
}