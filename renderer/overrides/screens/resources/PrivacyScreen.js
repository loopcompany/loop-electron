/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/resources/PrivacyScreen.js
 *
 * The privacy policy as a desktop reading page (@desktop/DocumentPage):
 * search, numbered sections, a table of contents and the document's
 * details (version, document number, author) under it. Same content as the
 * mobile file (./privacyPolicyContent), first section open.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import ScreenHeaders from '@components/ScreenHeaders';
import { PRIVACY_POLICY_META, PRIVACY_POLICY_SECTIONS, PRIVACY_POLICY_TITLE } from './privacyPolicyContent';

import DocumentPage from '@desktop/DocumentPage';
import { getFontFamily } from '@theme/Typography';
import { radii, surface } from '@desktop/desktopTheme';

export default function PrivacyScreen() {
  const { t } = useTranslation();
  // Expand first item by default
  const [expandedItems, setExpandedItems] = useState({ [PRIVACY_POLICY_SECTIONS[0].id]: true });

  return (
    <View style={styles.screen}>
      <ScreenHeaders title={t("Privacy Policy")} />
      <DocumentPage
        icon="lock-closed-outline"
        title={t("Privacy Policy")}
        lead={PRIVACY_POLICY_TITLE}
        meta={`تاریخ آخرین به‌روزرسانی: ${PRIVACY_POLICY_META.lastUpdated}`}
        items={PRIVACY_POLICY_SECTIONS}
        expanded={expandedItems}
        setExpanded={setExpandedItems}
        footer={
          <View style={styles.footer}>
            <Text style={styles.metaText}>{PRIVACY_POLICY_META.preparedBy}</Text>
            <Text style={styles.metaText}>
              نسخه: {PRIVACY_POLICY_META.version} · تاریخ تدوین: {PRIVACY_POLICY_META.lastUpdated} · شماره سند: {PRIVACY_POLICY_META.documentNumber}
            </Text>
            <Text style={styles.metaText}>{PRIVACY_POLICY_META.copyright}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  footer: {
    marginTop: 8,
    padding: 18,
    gap: 6,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: surface.borderStrong,
  },
  metaText: {
    fontSize: 12,
    lineHeight: 21,
    fontFamily: getFontFamily('light', 'fa'),
    color: surface.faint,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
});
