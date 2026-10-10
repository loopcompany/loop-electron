---
paths:
  - "renderer/desktop/**"
  - "renderer/overrides/**"
---

# Desktop UI ("Loop Nebula" design language)

React Native Web inside Electron. One layout only — the mobile layout (floating dock, menu modal)
is never shown. Min window 1100×700: `minWindow` in `renderer/desktop/Breakpoints.js` **and**
`MIN_WINDOW` in `electron/main.js` — change both together.

## Reuse before writing

Check exports first: `grep -n '^export' renderer/desktop/<file>.js`.
- Primitives → `ui.js` (`DButton`, `Card`, `Pill`, `IconTile`, `IconButton`, `EmptyState`,
  `Skeleton`, `Spinner`, `SectionHeader`, `PageContainer`, `useDir`, `formatNumber`)
- Forms → `FormKit.js` (`FormPage`, `FormSection`, `Field`, `FieldGrid`, `TextField`, `SelectField`,
  `PickerInput`, `ChoiceGroup`, `ChoiceCards`, `CheckRow`, `Toggle`, `UploadBox`, `TipsCard`)
- Auth forms → `AuthKit.js`; text pages → `DocumentPage.js`; wizards → `WizardLayout.js`;
  entry screens → `EntryLayout.js`; dialogs → `Dialog.js`; tables → `TransactionTable.js`.
Don't duplicate a component that already exists — extend it.

## Tokens & theming

- All colors/shadows/gradients/radii/motion from `desktopTheme.js` (`palette`, `surface`, `tone`,
  `elevation`, `gradients`, `radii`, `motion`). No raw hex in screens.
- Backgrounds: use `surface.*` (CSS variables via `THEME_VARS`, switch with dark mode without
  re-render), **not** `palette.white`.
- Cards with `data-loop-paper` (page/narrow mobile screens) stay light in dark mode on purpose.
- Content width/gaps only in `Breakpoints.js` (`contentMaxWidth`, `contentTopGap`, `contentGutter`).

## Layout per route

`screenLayouts.js`: `page` (default) · `narrow` (forms, receipts) · `dashboard` (desktop screens draw
their own grid) · `full` (no sidebar/top bar) · `auth` / `authWide`. A new mobile route needs no
work — it gets `page`. Sidebar visibility is `screensWithoutMenu` in the `MenuContext` override.

## RTL / i18n

- Persian (`fa`, RTL) + English. Use `useDir()` from `ui.js` → `{ t, lang, rtl, ... }`.
- Reuse the mobile i18n keys via `t('...')`. Desktop-only strings: a local `COPY = { fa, en }` object
  (pattern: `DashboardParts.js` `dashboardCopy`), not new mobile keys.
- Mirror direction-dependent things (arrows, gradients, padding sides) with `rtl`.
- Persian digits typed in numeric fields → `toLatinDigits` (AuthKit).

## React Native Web gotchas

- Animations: `animate()` / `loop()` from `globalStyles.js` — RNW accepts `animationKeyframes`,
  not `animationName`.
- Image bigger than its frame → `transform: scale`; RNW clamps image width to the parent.
- Hover/cursor/CSS-only props are fine (web only); no native-only APIs.
- Page title + back button: `usePublishPageTitle` (`pageTitle.js`); screen headers render nothing.
- Alerts: inline form errors / `Dialog`, not `alert()`; mobile helpers `showToastOrAlert` are OK.

## Performance

`StyleSheet.create` at module level; `useMemo`/`useCallback` for lists and handlers passed down;
keep `t` out of effect deps (ref pattern in the `Wallet` override); skeletons over spinners for
content areas; no heavy work in render.
