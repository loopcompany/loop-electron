/**
 * DESKTOP OVERRIDE of loop-customer-mobile/components/Folder.js
 *
 * A category tile on the moon artwork (sub-categories, the old home grid).
 * Same props and the same image logic as the mobile file (server image
 * first, local `imageSource` as placeholder and fallback, `icon` when there
 * is no image at all); drawn as a larger glass tile that lifts and glows
 * gold on hover, since a desktop has a pointer and room.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import React, { useEffect, useMemo, useState } from "react";
import { imageUri } from "@services/URL";
import { useTranslation } from "react-i18next";
import { createStyles } from "@styles/NewStyles";
import { motion } from "@desktop/desktopTheme";

export default function Folder({ onPress, title, style, loading, image, imageSource, icon }) {
  const { t, i18n } = useTranslation();
  const NewStyles = useMemo(
    () => createStyles(i18n.language),
    [i18n.language]
  );
  const [remoteFailed, setRemoteFailed] = useState(false);

  useEffect(() => {
    setRemoteFailed(false);
  }, [image]);

  const remote = image && !remoteFailed;
  const source = remote ? { uri: `${imageUri}/${image}` } : imageSource;

  return (
    <Pressable
      disabled={loading}
      onPress={onPress}
      accessibilityRole="button"
      style={({ hovered, pressed }) => [
        styles.button,
        hovered && styles.hover,
        pressed && styles.pressed,
        style,
        styles.layout,
      ]}
    >
      {source ? (
        <Image
          source={source}
          placeholder={remote ? imageSource : undefined}
          placeholderContentFit="contain"
          contentFit="contain"
          cachePolicy="memory-disk"
          priority="high"
          transition={150}
          onError={() => image && setRemoteFailed(true)}
          style={styles.folderIcon}
        />
      ) : (
        <View style={[styles.folderIcon, NewStyles.center]}>{icon}</View>
      )}
      <Text style={[NewStyles.title4, styles.title]} numberOfLines={2}>{t(title)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 12,
    width: 132,
    minHeight: 150,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backdropFilter: "blur(8px)",
    cursor: "pointer",
    transitionProperty: "transform, background-color, border-color, box-shadow",
    transitionDuration: motion.base,
  },
  layout: { alignItems: "center", justifyContent: "flex-start", gap: 10 },
  hover: {
    transform: "translateY(-4px)",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 215, 0, 0.55)",
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.35), 0 0 24px rgba(255, 215, 0, 0.18)",
  },
  pressed: { transform: "scale(0.97)" },
  folderIcon: {
    width: 84,
    height: 84,
    borderRadius: 22,
  },
  title: { fontSize: 14 },
});
