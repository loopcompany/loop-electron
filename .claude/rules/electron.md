---
paths:
  - "electron/**"
  - "test/**"
  - "scripts/**"
  - "electron-builder.yml"
  - "package.json"
  - "renderer/*.config.js"
---

# Electron main process, build & scripts

## Main process (`electron/`)

- CommonJS (`require`), Node ≥ 20.19.4, Electron 44.
- **Security is non-negotiable:** `contextIsolation: true`, `sandbox: true`, no `nodeIntegration`,
  permission requests allowlisted (notifications, geolocation, clipboard, fullscreen), everything
  else denied. Never open a second Electron window — external links go to the OS
  (`shell.openExternal`).
- `preload.js` exposes read-only `window.loopDesktop`; every new field is reachable by page script —
  add only what's needed. Shared code detects desktop with `!!window.loopDesktop`.
- `app://loop` origin is fixed (localStorage/login token live there). Extensionless paths serve
  `index.html` (like nginx `try_files`).
- Payment: gateway opens in the same window; bank redirect to `app://loop/?status=OK` is re-issued
  by main with `loadURL`.
- **URL decisions go in `routing.js` as pure functions, with a test in `test/routing.test.js`.**
  Keep `main.js` as wiring only.
- `appId` in `electron-builder.yml` ↔ `APP_USER_MODEL_ID` in `config.js` — keep in sync.
- Windows: frameless + `titleBarOverlay` with the app's `DesktopTitleBar`; Linux keeps native frame.

## Tests

`npm test` = `node --test test/*.test.js` (`node:test` + `node:assert/strict`). Add a test for any
routing change. Run it after every `electron/` edit.

## Scripts / build

- Shared paths in `scripts/paths.js` (`ROOT`, `RENDERER_DIR`, `MOBILE_DIR`, `SPAWN_OPTS`). Use
  `SPAWN_OPTS` (`shell: true` on Windows for npx shims).
- `build:web` = check-overrides → prepare-renderer (links mobile `node_modules`, copies `public/`) →
  `expo export -p web` → `web-build/`. Packaged app reads it from `resources/web`.
- `renderer/babel.config.js` `MOBILE_ALIASES` must match the mobile `babel.config.js` aliases
  (check-overrides enforces it). Add `@desktop`/`@mobile` only here.
- Logs prefixed `[loop]`. Scripts must work on Windows and Linux (use `path.join`, no shell-isms).
- Slow commands (`build:web`, `dist:win*`, `pack`): run only when the user asks.
