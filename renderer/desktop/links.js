/**
 * Loop's public web addresses, used by the sidebar and the entry / sign-in
 * screens. They open in the system browser: `Linking.openURL` is a
 * `window.open` on web, which electron/main.js hands to the OS.
 */
import { Linking } from 'react-native';

export const SITE_URL = 'https://clpiran.com';
export const SITE_LABEL = 'www.clpiran.com';
/** The site's download section for the Loop mobile apps. */
export const APPS_URL = 'https://clpiran.com/#apps';

export const openLink = (url) => Linking.openURL(url);
