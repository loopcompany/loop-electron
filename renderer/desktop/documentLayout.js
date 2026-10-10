/**
 * The `document` layout (./screenLayouts): the order receipt as a sheet of
 * paper floating on the wallpaper, instead of a phone screen inside the big
 * white page card.
 *
 * The receipt screens are the unchanged phone screens, which paint the moon
 * artwork and a light page colour behind the receipt. Inside the
 * `[data-loop-document]` frame (MenuContext) this:
 *   - hides the moon artwork (DOCUMENT_CSS, inline image styles), and
 *   - makes the screens' opaque page backgrounds see-through and tags the
 *     receipt sheet (`data-loop-sheet`) for its shadow (`useDocumentFrame`,
 *     because react-native-web turns StyleSheet styles into classes that CSS
 *     cannot match by colour).
 * No screen is edited.
 */
import { useEffect } from 'react';

/** Page backgrounds the receipt screens paint (NewStyles.container, React Navigation). */
const OPAQUE = new Set(['rgb(246, 248, 252)', 'rgb(242, 242, 242)', 'rgb(2, 3, 5)']);
/** The receipt's paper colour (receiptDesign pageBg #FDFDFD). */
const SHEET = 'rgb(253, 253, 253)';

export const DOCUMENT_CSS = `
[data-loop-document] [style*="moon."] { background-image: none !important; }
[data-loop-document] img[src*="moon."] { opacity: 0 !important; }
[data-loop-document] [data-loop-sheet] {
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 215, 0, 0.18) !important;
}
`;

export function useDocumentFrame(active, routeName) {
  useEffect(() => {
    if (!active || typeof document === 'undefined') return undefined;
    const root = document.querySelector('[data-loop-document]');
    if (!root) return undefined;

    let frame = 0;
    const scan = () => {
      frame = 0;
      root.querySelectorAll('div').forEach((el) => {
        if (el.dataset.loopDoc) return;
        const bg = getComputedStyle(el).backgroundColor;
        if (OPAQUE.has(bg)) {
          el.style.backgroundColor = 'transparent';
          el.dataset.loopDoc = '1';
        } else if (bg === SHEET && el.offsetWidth > 480 && !el.closest('[data-loop-sheet]')) {
          el.dataset.loopSheet = '';
          el.dataset.loopDoc = '1';
        }
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(scan);
    };

    scan();
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [active, routeName]);
}
