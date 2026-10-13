import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { elevation, motion, radii, surface } from './desktopTheme';
import { animate } from './globalStyles';
import { tip } from './tooltip';
import { IconButton, useDir } from './ui';

const COPY = {
  fa: { open: 'ایموجی', groups: ['چهره‌ها', 'دست‌ها', 'نمادها', 'اشیا'] },
  en: { open: 'Emoji', groups: ['Smileys', 'Hands', 'Symbols', 'Objects'] },
};

// A short, everyday set (no extra package); Windows draws them with Segoe UI Emoji.
const GROUPS = [
  ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🙂', '😉', '😊', '😇', '🥰', '😍', '😘', '😋', '😎', '🤩', '🥳', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😒', '😔', '😕', '🙁', '☹️', '😟', '😢', '😭', '😤', '😠', '😡', '😱', '😨', '😰', '😓', '🤗', '🤭', '🤫', '😴', '🤒', '🤕'],
  ['👍', '👎', '👌', '✌️', '🤞', '🤝', '🙏', '👏', '🙌', '👋', '✋', '🤚', '👊', '✊', '💪', '👆', '👇', '👈', '👉', '☝️', '🤙', '✍️'],
  ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤍', '💔', '✅', '❌', '⚠️', '❗', '❓', '⭐', '🌟', '✨', '🔥', '💯', '🎉', '🎁', '🌹', '🌸', '☀️', '🌙'],
  ['💻', '🖥️', '🖨️', '⌨️', '🖱️', '📱', '☎️', '📞', '🔌', '🔋', '💾', '💿', '📷', '🔧', '🔨', '🛠️', '⚙️', '📦', '📄', '📎', '📌', '🗓️', '⏰', '💳', '💰', '🚚', '🏢', '🏠'],
];

/**
 * The composer's emoji button: a small grid that opens above it. A click
 * inserts the emoji (the picker stays open for more); Esc, the button or a
 * click elsewhere closes it.
 *
 * @param {object} props
 * @param {(emoji: string) => void} props.onPick
 * @param {boolean} [props.disabled]
 */
export default function EmojiPicker({ onPick, disabled }) {
  const dir = useDir();
  const copy = COPY[dir.rtl ? 'fa' : 'en'];
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState(0);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onDown = (e) => {
      const root = rootRef.current;
      if (root && typeof root.contains === 'function' && !root.contains(e.target)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  return (
    <View ref={rootRef} style={styles.root}>
      <View {...tip(copy.open)}>
        <IconButton
          icon={open ? 'happy' : 'happy-outline'}
          label={copy.open}
          color={open ? surface.brandText : surface.muted}
          size={34}
          onPress={() => !disabled && setOpen((v) => !v)}
        />
      </View>
      {open && (
        <View style={[styles.panel, dir.rtl ? styles.panelRtl : styles.panelLtr, animate('loop-pop', '160ms')]}>
          <View style={[styles.tabs, dir.row]}>
            {GROUPS.map((items, i) => (
              <Pressable
                key={i}
                onPress={() => setGroup(i)}
                accessibilityRole="tab"
                accessibilityState={{ selected: group === i }}
                {...tip(copy.groups[i])}
                style={({ hovered }) => [styles.tab, (hovered || group === i) && styles.tabOn]}
              >
                <Text style={styles.tabEmoji}>{items[0]}</Text>
              </Pressable>
            ))}
          </View>
          <ScrollView style={styles.gridScroll} contentContainerStyle={[styles.grid, dir.row]}>
            {GROUPS[group].map((emoji) => (
              <Pressable
                key={emoji}
                onPress={() => onPick(emoji)}
                accessibilityRole="button"
                accessibilityLabel={emoji}
                style={({ hovered, pressed }) => [styles.cell, hovered && styles.cellHover, pressed && styles.cellPressed]}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'relative' },
  panel: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 8,
    width: 316,
    padding: 8,
    gap: 6,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: surface.border,
    backgroundColor: surface.card,
    boxShadow: elevation.floating,
    zIndex: 20,
  },
  panelRtl: { right: 0 },
  panelLtr: { left: 0 },
  tabs: { gap: 4, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: surface.border },
  tab: { width: 36, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  tabOn: { backgroundColor: surface.hover },
  tabEmoji: { fontSize: 17 },
  gridScroll: { maxHeight: 210 },
  grid: { flexWrap: 'wrap' },
  cell: {
    width: 37,
    height: 37,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transitionProperty: 'background-color, transform',
    transitionDuration: motion.fast,
  },
  cellHover: { backgroundColor: surface.hover, transform: 'scale(1.12)' },
  cellPressed: { transform: 'scale(0.94)' },
  emoji: { fontSize: 21, lineHeight: 28 },
});
