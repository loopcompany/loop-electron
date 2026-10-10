---
paths:
  - "renderer/overrides/**"
  - "overrides.lock.json"
  - "scripts/check-overrides.js"
  - "renderer/metro.config.js"
---

# Overrides — desktop copies of mobile files

`renderer/overrides/<path>` replaces `../loop-customer-mobile/<path>` for **every** importer
(Metro resolver in `renderer/metro.config.js`). Relative imports inside an override (`./foo`)
resolve from the **mobile file's folder**, as if the override sat there.

## When to make one

Only when nothing else works. Each override is a copy that must be re-synced every time the mobile
file changes. Cheaper alternatives first:
1. Layout/frame only → `renderer/desktop/screenLayouts.js` (no override needed).
2. Global look → existing global overrides (`styles/NewStyles.js`, `components/Button.js`, ...).
3. CSS scoped by a data attribute (see `renderer/desktop/glassAuth.js`).

## Creating one (recipe)

1. `cp ../loop-customer-mobile/<path> renderer/overrides/<path>` (same relative path, exactly).
2. Add the header (copy from any existing override):
   ```js
   /**
    * DESKTOP OVERRIDE of loop-customer-mobile/<path>
    *
    * <what the desktop version looks like>. Same data flow as the mobile file: <requests/state kept>.
    *
    * When the mobile file changes, `npm run check:overrides` fails: port the
    * change here, then run `npm run overrides:accept`.
    */
   ```
3. Change **only the presentation**. Keep requests, Redux, validation, navigation params, effect
   dependencies and i18n keys identical to the mobile file.
4. Build the UI from `@desktop/*` kits (ui, FormKit, AuthKit, DashboardParts, DocumentPage...).
5. If it is a desktop-designed screen, set its route to `dashboard` in `screenLayouts.js`.
6. `npm run overrides:accept` to pin the hash, then `npm run check:overrides`.
7. Tell the user: **a new override file is only picked up after restarting `npm run dev`**.
8. Add it to the overrides table in `README.md` (Persian) if it is a new screen.

## Porting a mobile change (check:overrides failed)

1. `git -C ../loop-customer-mobile log -p -- <path>` (the error prints this) — read only the diff.
2. Apply the logic change to the override, keeping the desktop UI.
3. `npm run overrides:accept && npm run check:overrides`.

Never run `overrides:accept` without porting the change — it would hide the drift.
