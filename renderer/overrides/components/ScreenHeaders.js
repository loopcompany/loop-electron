/**
 * DESKTOP OVERRIDE of loop-customer-mobile/components/ScreenHeaders.js
 *
 * Metro serves this file instead of the mobile one in the desktop bundle
 * (see renderer/metro.config.js). On a phone every screen draws its own title
 * bar; on the desktop the window has one top bar for all pages
 * (@desktop/shell/DesktopTopBar), so this component draws nothing. It
 * registers the screen's title and, when the screen passed one, its own back
 * behaviour (same priority as the mobile file: onBackPress > onPressLeft) for
 * the top bar to use.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import { useContext } from "react";
import { NavigationRouteContext } from "@react-navigation/native";
import { usePublishPageTitle } from "@desktop/pageTitle";

const ScreenHeaders = ({
  title,
  // Old API (deprecated but still supported for backward compatibility)
  onPressLeft,
  // eslint-disable-next-line no-unused-vars
  onPressRight,
  // New API (recommended - more clear naming)
  onBackPress
}) => {
  // Rendered both inside screens and as a navigator `header`; either way a
  // route is in context, but don't crash if some caller renders it outside.
  const route = useContext(NavigationRouteContext);
  usePublishPageTitle(route?.key, title, onBackPress || onPressLeft);
  return null;
};

export default ScreenHeaders;
