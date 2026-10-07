import { StyleSheet, Text, View } from 'react-native';

import { BrandStory } from './EntryLayout';
import { onDark } from './desktopTheme';
import { getFontFamily } from '@theme/Typography';

/**
 * The side of the sign-in window that isn't the form: the same brand story
 * as the entry screens, over the window-wide artwork the shell draws behind
 * both (@desktop/EntryLayout CosmicBackdrop). Purely decorative — the form
 * beside it is the unchanged mobile screen.
 *
 * @param {object} props
 * @param {string} props.lang
 * @param {boolean} [props.compact]  beside the wide sign-up form
 */
export default function DesktopAuthPanel({ lang, compact }) {
  const version = typeof window !== 'undefined' ? window.loopDesktop?.appVersion : null;
  return (
    <View style={[styles.panel, compact && styles.panelCompact]}>
      <BrandStory style={styles.story} compact={compact} />
      <Text style={[styles.footer, { fontFamily: getFontFamily('light', lang) }]}>
        www.clpiran.com{version ? `  ·  v${version}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingHorizontal: 56,
    paddingVertical: 48,
  },
  panelCompact: { paddingHorizontal: 40 },
  story: { alignSelf: 'center', width: '100%' },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: onDark.muted,
    fontSize: 12,
  },
});
