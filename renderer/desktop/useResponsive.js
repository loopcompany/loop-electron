import { Platform, useWindowDimensions } from 'react-native';

/**
 * True when running inside the Electron shell (its preload exposes
 * `window.loopDesktop`). Layout does not depend on it — the bundle is always
 * laid out as a desktop app — it's for code that needs the OS bridge itself.
 */
export const isDesktopApp = () =>
  Platform.OS === 'web' && typeof window !== 'undefined' && !!window.loopDesktop?.isDesktop;

/**
 * The desktop bundle has a single layout: screens fill the window next to a
 * permanent sidebar. Even when the window is zoomed (Ctrl +) far enough that
 * its CSS width drops to phone size, the phone layout (floating dock, menu
 * modal) never comes back. The shape of the result is kept so the
 * MenuContext override stays close to the mobile file.
 */
export default function useResponsive() {
  const { width, height } = useWindowDimensions();

  return {
    width,
    height,
    layout: 'expanded',
    isCompact: false,
    isMedium: false,
    isExpanded: true,
    hasSidebar: true,
  };
}
