import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Dialog from './Dialog';
import { motion, palette, surface } from './desktopTheme';
import { tip } from './tooltip';
import { DButton, useDir } from './ui';

const COPY = {
  fa: { label: 'راهنما', ok: 'متوجه شدم' },
  en: { label: 'Help', ok: 'Got it' },
};

/**
 * The small "?" on a home card: its name on hover, and on click a dialog that
 * explains what the card is for and how its flow goes. It sits inside the
 * card's own Pressable; a press here never opens the card.
 *
 * @param {object} props
 * @param {{ title: string, text: string, points?: string[] }} props.help
 * @param {boolean} [props.dark]   on a dark (hero) card
 */
export default function HelpButton({ help, dark = true }) {
  const dir = useDir();
  const copy = COPY[dir.rtl ? 'fa' : 'en'];
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <Pressable
        onPress={(e) => {
          e?.stopPropagation?.();
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${copy.label}: ${help.title}`}
        {...tip(copy.label)}
        style={({ hovered, pressed }) => [
          styles.button,
          dark ? styles.onDark : styles.onLight,
          hovered && styles.hover,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="help" size={16} color={dark ? palette.gold : palette.brand} />
      </Pressable>
      <Dialog
        visible={open}
        onClose={close}
        icon="help-circle-outline"
        kind="info"
        title={help.title}
        message={help.text}
        width={480}
        actions={<DButton title={copy.ok} variant="gold" onPress={close} />}
      >
        {!!help.points?.length && (
          <View style={styles.points}>
            {help.points.map((point, i) => (
              <View key={i} style={[styles.point, dir.row]}>
                <View style={styles.pointIndex}>
                  <Text style={[styles.pointIndexText, dir.bold]}>{i + 1}</Text>
                </View>
                <Text style={[styles.pointText, dir.light, dir.align]}>{point}</Text>
              </View>
            ))}
          </View>
        )}
      </Dialog>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color, transform',
    transitionDuration: motion.fast,
  },
  onDark: { borderColor: 'rgba(255, 215, 0, 0.45)', backgroundColor: 'rgba(255, 255, 255, 0.06)' },
  onLight: { borderColor: surface.border, backgroundColor: surface.card },
  hover: { borderColor: palette.gold, backgroundColor: 'rgba(255, 215, 0, 0.14)', transform: 'scale(1.06)' },
  pressed: { transform: 'scale(0.96)' },
  points: { gap: 10, marginTop: 4 },
  point: { alignItems: 'flex-start', gap: 10 },
  pointIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
  },
  pointIndexText: { color: surface.brandText, fontSize: 12 },
  pointText: { flex: 1, color: surface.text, fontSize: 13.5, lineHeight: 24 },
});
