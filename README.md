# RiseForge

 extension for **Articulate Rise 360** that adds interactive blocks, mods, powerups, an assistant sidebar, and an SDK — built with performance and UI polish as the priority.

Buildless **Manifest V3** extension. No Angular, no bundlers, no vendor bundles — plain ES modules + native Web Components (`rf-*`), lazy-loaded per feature route.

---

## Features

### Interactive blocks (`extension-app/blocks/`)
| Block | What it does |
| --- | --- |
| **Multiple Choice** | Stylish quiz block with question, options, correct answer, per-option feedback, and SCORM-style tracking |
| **Image Comparison** | Side-by-side slider comparing two images (before/after) |
| **Reflection** | Guided reflection prompt with a text box and optional required-answer behaviour |
| **Reverse Hotspot** | Clickable regions with optional click-outside / undo tracking |
| **Transition** | Animated fade/slide/zoom transition frames |
| **Interactive HTML** | Embed arbitrary HTML/CSS/JS in a sandboxed iframe, optionally with the Forge Interactive SDK bridge |

### Mods (`extension-app/mods/`)
Global tweaks applied to the page: video hide-controls, video autoplay, audio autoplay, audio prevent-seek, navigation step-count, button radius, card radius, column spacing.

### Powerups (`extension-app/powerups/`)
- **Custom Code** — inject CSS/JS before `</head>` / `</body>`
- **Find & Replace** — search/replace across HTML, attributes and text nodes
- **Global Styles** — drop a stylesheet onto every page
- **Published Title** — retitle the document
- **Translations** — per-course key/value string overrides

### Assistant (`extension-app/pages/assistant/`)
A side drawer with **Login**, **Home**, **Referral** and **Maestro** (AI companion) views. Also available as a popup.

### SDKs (`sdk/`)
- `forge-interactive-sdk.js` — `window.ForgeInteractive` API for interactive blocks in sandboxed iframes (state, tracking, height sync, messaging)
- `forge-custom-code-sdk.js` — `window.forgeCustomCodeSdk` (aliased as `mightyCustomCodeSdk` for compatibility)

---

## Install (unpacked)

1. Clone or download this repo.
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the repo root (`riseforge/`).
5. Open **any Rise 360 course** at `*.articulate.com` in the editor. The assistant, blocks, mods and powerups appear there.

> The extension activates on `*.articulate.com` authoring/preview routes and the Maestro Learning / Design With Mighty companion domains, matching the original extension's behaviour.

## Project structure

```
riseforge/
├── manifest.json                 # MV3 manifest
├── extension-scripts/
│   ├── background.js             # service worker: env config, batched local-first telemetry
│   ├── rise-router-script.js     # route detection + lazy runtime injection + styles
│   └── extension-installed-script.js
├── extension-app/
│   ├── index.html                # runtime bootstrap page
│   ├── runtime.js                # page-world boot: feature-chunk loader
│   ├── core/                     # DI container, event bus, storage, api client, telemetry, ext-url
│   ├── style/design-system.css   # design tokens (--rf-*)
│   ├── shared/                   # rf-base + rf-* web components (input, slider, dialog, toast…)
│   ├── blocks/                   # block registry, 6 blocks, editor shell, mods panel
│   ├── mods/                     # mod registry + implementations
│   ├── powerups/                 # powerup registry + 5 powerups
│   └── pages/                    # assistant app + viewer app (published page powerups)
├── sdk/                          # interactive + custom-code SDKs
└── assets/icons/                 # extension icons
```

## Architecture notes

- **Two worlds, like Mighty**: a small *isolated-world* content script injects the *page-world* runtime; page-world code never touches `chrome.*` — it uses `localStorage` and a `data-rf-*` bootstrap contract.
- **Route-gated lazy loading**: feature chunks (`editor-shell`, `assistant`, `viewer`, `powerups`, `mods`) are loaded via dynamic `import()` only when the relevant route mounts — one small stylesheet, the rest is on demand.
- **Local-first**: block configs persist per course in `localStorage`; telemetry batches and stays local (no third-party server).
- **Design system**: tokens + shadow-DOM components keep RiseForge UI consistent and CSS-isolated on Articulate pages.

## Development / verification

The project is intentionally buildless — no compile step. The full suite used during development (Node >= 20):

- Syntax check: mirror every file as `.mjs` and run `node --check`.
- Smoke test: stub the DOM/chrome globals, `import()` every module, assert no top-level throw.
- Boot path test: load `runtime.js` with a DOM stub and assert the editor chunk mounts.
- Functional test: exercise `BlockStore`, builder defaults and the block registry against a DOM stub.

```bash
node --check extension-app/runtime.js          # syntax
# harnesses live in a temp dir; see scripts above for the DOM-stub pattern
```

## Privacy

RiseForge is local-first: block/mod/powerup configuration lives in your browser, telemetry is batched and stored locally, and no usage data is sent anywhere.

## License

MIT — use it, fork it, improve it.
