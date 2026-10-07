import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { elevation, palette, radii, surface } from './desktopTheme';
import { animate } from './globalStyles';
import { shellLabels } from './routeMeta';
import { getFontFamily } from '@theme/Typography';

/**
 * Ctrl+K / Ctrl+F jump-to-anything: every page in the menu plus the common
 * actions, filtered as you type, driven from the keyboard (↑ ↓ Enter Esc).
 *
 * @typedef {{ id: string, title: string, icon: string, group: 'pages'|'actions', keywords?: string, run: () => void }} Command
 *
 * @param {object} props
 * @param {boolean} props.visible
 * @param {() => void} props.onClose
 * @param {Command[]} props.commands
 * @param {string} props.lang
 */
export default function CommandPalette({ visible, onClose, commands, lang }) {
  const rtl = lang === 'fa';
  const L = shellLabels(lang);
  const row = { flexDirection: rtl ? 'row-reverse' : 'row' };
  const align = { textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' };
  const bold = { fontFamily: getFontFamily('bold', lang) };
  const light = { fontFamily: getFontFamily('light', lang) };

  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? commands.filter((c) => `${c.title} ${c.keywords || ''}`.toLowerCase().includes(q))
      : commands;
    // actions first, then pages — the order the panel draws them in
    return [...list.filter((c) => c.group === 'actions'), ...list.filter((c) => c.group === 'pages')];
  }, [commands, query]);

  useEffect(() => {
    if (!visible) return;
    setQuery('');
    setIndex(0);
    const id = setTimeout(() => inputRef.current?.focus?.(), 30);
    return () => clearTimeout(id);
  }, [visible]);

  useEffect(() => setIndex(0), [query]);

  useEffect(() => {
    if (!visible) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const picked = results[index];
        if (picked) {
          onClose();
          picked.run();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [visible, results, index, onClose]);

  if (!visible) return null;

  let lastGroup = null;

  return (
    <View style={[styles.overlay, animate('loop-fade-in', '140ms')]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={L.close} />
      <View style={[styles.panel, animate('loop-pop', '180ms')]} accessibilityRole="dialog">
        <View style={[styles.inputRow, row]}>
          <Ionicons name="search" size={20} color={palette.brandBright} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder={L.searchHint}
            placeholderTextColor={surface.faint}
            style={[styles.input, light, align]}
          />
          <Text style={[styles.esc, bold]}>Esc</Text>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
          {results.length === 0 && (
            <View style={styles.noResults}>
              <Ionicons name="planet-outline" size={34} color={surface.faint} />
              <Text style={[styles.noResultsText, light]}>{L.noResults}</Text>
            </View>
          )}
          {results.map((command, i) => {
            const header = command.group !== lastGroup ? command.group : null;
            lastGroup = command.group;
            const active = i === index;
            return (
              <View key={command.id}>
                {header && <Text style={[styles.group, bold, align]}>{L[header]}</Text>}
                <Pressable
                  onPress={() => {
                    onClose();
                    command.run();
                  }}
                  onHoverIn={() => setIndex(i)}
                  accessibilityRole="menuitem"
                  style={[styles.item, row, active && styles.itemActive]}
                >
                  <View style={[styles.itemIcon, active && styles.itemIconActive]}>
                    <Ionicons name={command.icon} size={17} color={active ? palette.white : surface.brandText} />
                  </View>
                  <Text style={[styles.itemText, active ? bold : light, align]} numberOfLines={1}>
                    {command.title}
                  </Text>
                  {active && <Ionicons name="return-down-back" size={16} color={surface.faint} />}
                </Pressable>
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.footer, row]}>
          <View style={[styles.hint, row]}>
            <Text style={[styles.key, bold]}>↑↓</Text>
            <Text style={[styles.hintText, light]}>{L.navigate}</Text>
          </View>
          <View style={[styles.hint, row]}>
            <Text style={[styles.key, bold]}>Enter</Text>
            <Text style={[styles.hintText, light]}>{L.open}</Text>
          </View>
          <View style={[styles.hint, row]}>
            <Text style={[styles.key, bold]}>Esc</Text>
            <Text style={[styles.hintText, light]}>{L.close}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    alignItems: 'center',
    paddingTop: '11vh',
    backgroundColor: 'rgba(4, 15, 31, 0.55)',
    backdropFilter: 'blur(6px)',
  },
  panel: {
    width: 640,
    maxWidth: '92%',
    maxHeight: '70vh',
    borderRadius: radii.xl,
    backgroundColor: surface.card,
    boxShadow: elevation.floating,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  inputRow: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: surface.border,
  },
  input: { flex: 1, height: 64, fontSize: 16, color: surface.text, outlineStyle: 'none' },
  esc: {
    fontSize: 11,
    color: surface.muted,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: surface.sunken,
    borderWidth: 1,
    borderColor: surface.border,
    overflow: 'hidden',
  },
  list: { flexGrow: 0 },
  listContent: { padding: 8 },
  group: { fontSize: 11, color: surface.faint, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6 },
  item: {
    alignItems: 'center',
    gap: 12,
    height: 46,
    paddingHorizontal: 10,
    borderRadius: radii.md,
    cursor: 'pointer',
  },
  itemActive: { backgroundColor: 'rgba(29, 95, 174, 0.08)' },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 43, 84, 0.06)',
  },
  itemIconActive: { backgroundImage: 'linear-gradient(135deg, #134379 0%, #002b54 100%)' },
  itemText: { flex: 1, fontSize: 14, color: surface.text },
  noResults: { alignItems: 'center', paddingVertical: 36, gap: 10 },
  noResultsText: { color: surface.faint, fontSize: 13 },
  footer: {
    gap: 18,
    paddingHorizontal: 18,
    height: 42,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: surface.border,
    backgroundColor: surface.cardMuted,
  },
  hint: { alignItems: 'center', gap: 6 },
  key: {
    fontSize: 10.5,
    color: surface.muted,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
    backgroundColor: surface.card,
    borderWidth: 1,
    borderColor: surface.border,
    overflow: 'hidden',
  },
  hintText: { fontSize: 11.5, color: surface.faint },
});
