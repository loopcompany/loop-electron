/**
 * DESKTOP OVERRIDE of loop-customer-mobile/components/Button.js
 *
 * Same props and behaviour (`disabled` and `loading` both make it inert; a
 * caller's `style` / `textStyle` still win), drawn as the desktop primary
 * button: brand gradient, a lift on hover, a press state, and a desktop
 * height instead of the 50px thumb target.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import React from "react";
import { themeColor3, themeColor4 } from "@theme/Color";
import NewStyles from "@styles/NewStyles";
import { elevation, gradients, motion } from "@desktop/desktopTheme";

export default function Button({ onPress, title, style, loading, disabled, textStyle }) {
  const inactive = Boolean(loading || disabled);

  return (
    <Pressable
      // lets the glass sign-in card restyle the primary action (desktop/glassAuth.js)
      dataSet={{ loopPrimary: '' }}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: Boolean(loading) }}
      style={({ hovered, pressed }) => [
        styles.button,
        NewStyles.center,
        hovered && !inactive && styles.hover,
        pressed && !inactive && styles.pressed,
        disabled && !loading && styles.disabled,
        style,
      ]}
      onPress={onPress}
    >
      {loading && (
        <ActivityIndicator size={"small"} color={themeColor4.bgColor(1)} />
      )}
      {!loading && <Text style={[NewStyles.title1, styles.text, textStyle]}>{title}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundImage: gradients.brand,
    paddingHorizontal: 32,
    marginVertical: 10,
    width: "100%",
    height: 48,
    alignItems: "center",
    maxWidth: 400,
    borderRadius: 14,
    cursor: "pointer",
    transitionProperty: "transform, box-shadow, filter",
    transitionDuration: motion.fast,
  },
  hover: { transform: "translateY(-1px)", boxShadow: elevation.brand, filter: "brightness(1.06)" },
  pressed: { transform: "scale(0.985)" },
  text: { width: '100%', textAlign: 'center', fontSize: 15 },
  disabled: {
    backgroundImage: "none",
    backgroundColor: themeColor3.bgColor(1),
    opacity: 0.8,
    cursor: "default",
  },
});
