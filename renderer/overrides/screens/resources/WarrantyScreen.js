/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/resources/WarrantyScreen.js
 *
 * The warranty page, as a desktop reading page (@desktop/DocumentPage): search,
 * numbered sections, a table of contents and a way to reach support. Same
 * data and behaviour as the mobile file (`infoAPI.getTerms`, first section
 * open, the same error toast) and each item's warranties as checked chips.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import ScreenHeaders from '@components/ScreenHeaders';
import { infoAPI } from '@services/Api';
import { showToastOrAlert } from '@helpers/Common';
import BlankScreen from '@components/BlankScreen';

import DocumentPage from '@desktop/DocumentPage';

export default function WarrantyScreen() {
  const { t, i18n } = useTranslation();
  const [warranties, setWarranties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    loadFaqs();
  }, [isRefreshing]);

  const loadFaqs = async () => {
    try {
      const response = await infoAPI.getWarranty();

      if (response.status === 'success') {
        setWarranties(response.data);
        // Expand first item by default
        if (response.data.length > 0) {
          setExpandedItems({ [response.data[0].id]: true });
        }
      } else {
        showToastOrAlert(t('Error loading warranty'));
      }
    } catch (error) {
      console.error('❌ Error loading warranties:', error);
      showToastOrAlert(t('Error loading warranty'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fa = i18n.language === 'fa';
  return (
    <View style={styles.screen}>
      <ScreenHeaders title={t("Warranty / Guarantee")} />
      <DocumentPage
        icon="shield-checkmark-outline"
        title={t("Warranty / Guarantee")}
        lead={fa ? 'شرایط استفاده از خدمات لوپ و آنچه باید درباره\u200cی ما بدانید.' : 'The guarantee on each service and what it covers.'}
        items={warranties}
        expanded={expandedItems}
        setExpanded={setExpandedItems}
        loading={isLoading}
        refreshing={isRefreshing}
        onRefresh={() => setIsRefreshing(true)}
        empty={<BlankScreen />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
});
