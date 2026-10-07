import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { elevation, palette, radii, surface, tone } from './desktopTheme';
import { animate } from './globalStyles';
import { useDir } from './ui';

/**
 * A centred desktop dialog over a blurred scrim. Esc and a click outside
 * close it (when `onClose` is given).
 *
 * @param {object} props
 * @param {boolean} props.visible
 * @param {() => void} [props.onClose]
 * @param {string} [props.title]
 * @param {string} [props.message]
 * @param {string} [props.icon]
 * @param {'brand'|'danger'|'warning'|'success'|'info'} [props.kind]
 * @param {number} [props.width]
 * @param {import('react').ReactNode} [props.children]
 * @param {import('react').ReactNode} [props.actions]
 */
export default function Dialog({ visible, onClose, title, message, icon, kind = 'brand', width = 460, children, actions }) {
  const dir = useDir();

  useEffect(() => {
    if (!visible || !onClose) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, onClose]);

  const c = tone[kind] || tone.brand;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={[styles.scrim, animate('loop-fade-in', '140ms')]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} disabled={!onClose} />
        <View style={[styles.card, { width }, animate('loop-pop', '200ms')]} accessibilityRole="dialog">
          {onClose && (
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              style={({ hovered }) => [styles.close, dir.rtl ? styles.closeLeft : styles.closeRight, hovered && styles.closeHover]}
            >
              <Ionicons name="close" size={18} color={surface.muted} />
            </Pressable>
          )}
          {(icon || title) && (
            <View style={[styles.head, dir.start]}>
              {!!icon && (
                <View style={[styles.icon, { backgroundColor: c.bg }]}>
                  <Ionicons name={icon} size={24} color={c.fg} />
                </View>
              )}
              {!!title && <Text style={[styles.title, dir.bold, dir.align]}>{title}</Text>}
              {!!message && <Text style={[styles.message, dir.light, dir.align]}>{message}</Text>}
            </View>
          )}
          {children}
          {actions && <View style={[styles.actions, dir.row]}>{actions}</View>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(4, 15, 31, 0.5)',
    backdropFilter: 'blur(5px)',
  },
  card: {
    maxWidth: '100%',
    maxHeight: '90%',
    borderRadius: radii.xl,
    backgroundColor: surface.card,
    padding: 26,
    gap: 18,
    boxShadow: elevation.floating,
  },
  close: {
    position: 'absolute',
    top: 14,
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 1,
  },
  closeLeft: { left: 14 },
  closeRight: { right: 14 },
  closeHover: { backgroundColor: surface.hover },
  head: { gap: 10 },
  icon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { fontSize: 18, color: surface.title },
  message: { fontSize: 14, color: surface.muted, lineHeight: 24 },
  actions: { gap: 10, justifyContent: 'flex-start', marginTop: 4 },
});
