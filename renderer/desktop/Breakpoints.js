// Fixed dimensions of the desktop shell.
//
// The bundle only ever runs as a desktop application, so there are no
// responsive breakpoints: every screen fills the window next to the sidebar,
// and the window itself can't be made narrower than `minWindow`
// (electron/main.js uses the same numbers).

export const minWindow = {
  width: 1100,
  height: 700,
};

export const sidebarWidth = 272;

/** Width of the sidebar folded into an icon rail. */
export const sidebarRailWidth = 76;

/**
 * Every page's content shares one width and one gap under the top bar, so
 * moving between pages never shifts the layout: desktop-designed pages lay
 * their cards out within `contentMaxWidth`, framed pages get a card of that
 * width, and single-column forms (`narrow`) centre a `narrowContentWidth`
 * column inside that same card.
 */
export const contentMaxWidth = 1320;
export const narrowContentWidth = 880;
/** Column of the `document` layout (the receipt sheet). */
export const documentWidth = 860;
/** Side padding of the page area. */
export const contentGutter = 28;

/** Height of the top bar above every page. */
export const topBarHeight = 76;

/**
 * The starry band behind the top bar: the header strip of every page, with
 * rounded bottom corners. Content starts below it, never on top of it.
 */
export const bandHeight = topBarHeight + 24;

/** The top bar sits centred in the band: this much band above and below it. */
export const topBarInset = (bandHeight - topBarHeight) / 2;

/** Space from the end of the top bar to the first card: the rest of the band plus a clear gap. */
export const contentTopGap = topBarInset + 26;

/** Height of the custom title bar on Windows (matches titleBarOverlay in electron/main.js). */
export const titleBarHeight = 36;

/** The form column of the sign-in frame; the brand panel takes the rest. */
export const authFormWidth = {
  min: 460,
  ideal: '42%',
  max: 620,
};

/** The form column of the `authWide` layout (long sign-up forms). */
export const authWideFormWidth = {
  min: 640,
  ideal: '60%',
  max: 880,
};
