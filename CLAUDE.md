# Loop Desktop — Working Rules

Electron (Windows) shell around the **sibling** Expo/React Native project `../loop-customer-mobile`
(override path: `LOOP_MOBILE_DIR`). Screens, Redux, API services and i18n are read from the mobile
project. **Never edit `../loop-customer-mobile`.** All desktop code lives in this repo.

Detailed rules load automatically from `.claude/rules/` when you touch matching paths.
`README.md` is the long human doc (Persian): read only the section you need, never the whole file.

## Speed & token rules (follow every task)

1. **Don't explore — use the map below.** Go straight to the file. No `ls -R`, no reading whole
   dirs, no re-reading README/CLAUDE.md.
2. **Read narrowly.** `grep -n` first, then `Read` with `offset/limit`. Big files (lines):
   AuthKit 1089, FormKit 724, DesktopSidebar 535, WizardLayout 458, DocumentPage 447, ui 423.
   Get exports with `grep -n '^export' renderer/desktop/<file>.js`.
3. **Mobile code questions** → `../loop-customer-mobile/graphify-out/GRAPH_REPORT.md` or a targeted
   `grep -rn` with `--include=*.js --exclude-dir=node_modules`. Its `CLAUDE.md` has the mobile
   conventions (colors, alerts, API layer) — grep its headings, read only the relevant section.
4. **Batch independent tool calls** in one message. Chain shell commands with `&&`.
5. **No subagents / workflows** unless the user asks. Small task → just do it.
6. **Verify cheaply:** `npm test` (routing only, ~1s) and `npm run check:overrides`. Don't run
   `build:web` / `dist:*` unless asked — they are slow. UI changes need `npm run dev` to see.
7. **Answer short.** Report what changed + file links. No recap of unchanged things.

## Map — where things are

| Need | File |
| --- | --- |
| Window, shortcuts, context menu, nav handling | `electron/main.js` |
| URL allow/deny/external decisions (pure, tested) | `electron/routing.js` + `test/routing.test.js` |
| `app://loop` file serving | `electron/protocol.js` |
| `window.loopDesktop` bridge | `electron/preload.js` |
| App id, web root, config | `electron/config.js` |
| Which layout a route gets (`page/narrow/dashboard/full/auth/authWide`) | `renderer/desktop/screenLayouts.js` |
| Widths, min window, bar heights | `renderer/desktop/Breakpoints.js` |
| Colors, shadows, gradients, radii, motion, `THEME_VARS` | `renderer/desktop/desktopTheme.js` |
| Light/dark switch | `renderer/desktop/theme.js` |
| UI kit: `DButton Card Pill IconTile EmptyState Skeleton Spinner SectionHeader useDir formatNumber` | `renderer/desktop/ui.js` |
| Desktop forms: `FormPage FormSection Field FieldGrid TextField SelectField ChoiceGroup Toggle UploadBox` | `renderer/desktop/FormKit.js` |
| Sign-in/up forms: `AuthScreen AuthField AuthInput OtpInput CaptchaField SubmitButton` | `renderer/desktop/AuthKit.js` |
| Dashboard widgets | `renderer/desktop/DashboardParts.js` |
| Text pages (FAQ, terms, privacy) | `renderer/desktop/DocumentPage.js` |
| Order wizard frame | `renderer/desktop/WizardLayout.js` |
| Full-window entry screens | `renderer/desktop/EntryLayout.js` |
| Modal dialog | `renderer/desktop/Dialog.js` |
| Sidebar nav groups + route icons | `renderer/desktop/routeMeta.js`, `DesktopSidebar.js` |
| Top bar / page title / back | `DesktopTopBar.js`, `pageTitle.js` (`usePublishPageTitle`) |
| Ctrl+K palette | `renderer/desktop/CommandPalette.js` |
| Global CSS, `animate()` / `loop()` | `renderer/desktop/globalStyles.js` |
| Shell wiring (sidebar + frame per route) | `renderer/overrides/contexts/MenuContext.js` |
| Desktop replacements of mobile files | `renderer/overrides/<same path as mobile>` |
| Override drift hashes | `overrides.lock.json` (edit only via `npm run overrides:accept`) |
| Metro override resolver / aliases | `renderer/metro.config.js`, `renderer/babel.config.js` |
| Build / dev scripts | `scripts/*.js`, `electron-builder.yml` |
| Installer (Persian, custom welcome page) | `build/installer.nsh`; art: `scripts/installer-art/pages.html` → `npm run installer:art` |
| In-app `alert()` toast, `confirm()` refocus | `renderer/desktop/dialogShims.js` (+ `loop:refocus` in `main.js`) |

## Hard rules

- Never edit `../loop-customer-mobile` (shared, other team). Need a change there → make an override
  or tell the user.
- Never change the `app://loop` origin (logs out every user — localStorage lives on it).
- Never weaken Electron security: `contextIsolation`, `sandbox`, no `nodeIntegration`, permission
  allowlist fails closed. Keep `preload.js` surface minimal.
- Never hand-edit `overrides.lock.json`.
- Run with `npm start` / `npm run dev`, never `electron .` (VS Code sets `ELECTRON_RUN_AS_NODE`).
- No new dependencies without asking (renderer packages come from the mobile `node_modules`).
- Don't commit unless asked. Commit style: short imperative subject.

## Commands

`npm run dev` (Metro :8081 + Electron, hot reload) · `npm start` (runs `web-build/`) ·
`npm test` · `npm run check:overrides` · `npm run overrides:accept` · `npm run build:web` ·
`npm run dist:win` (NSIS, needs Wine on Linux) · `npm run dist:win:portable` (zip) ·
`npm run installer:art` (re-render `build/installer/*` after editing the design) ·
`LOOP_SCREENSHOT=out.png npm start` (screenshot smoke test) · `LOOP_TITLEBAR=overlay npm run dev`.

## Code style

Prettier (mobile config): 100 cols, single quotes, semicolons, trailing commas es5, 2-space indent.
Some overrides keep the 4-space indent of the mobile file they copy — **match the file you edit**.
Each file opens with a short doc comment saying what it is and why; keep comment density similar.
Desktop imports: `@desktop/...`; mobile code: `@components @screens @services @slices @helpers ...`
(never long relative paths into the mobile repo).

## Status / next up

Done: shell, `app://`, NSIS + portable build, desktop layout + design system, most screens.
Next: order details (`Details`), profile; review logged-in screens with a real test account;
native Windows notifications (FCM web doesn't work in Electron); auto-update + code signing.
