/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/resources/AboutScreen.js
 *
 * The terms / about page, as a desktop reading page (@desktop/DocumentPage): search,
 * numbered sections, a table of contents and a way to reach support. Same
 * data and behaviour as the mobile file (`infoAPI.getTerms`, first section
 * open, the same error toast).
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

export default function AboutScreen() {
  const { t, i18n } = useTranslation();
  const [terms, setTerms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    loadFaqs();
  }, [isRefreshing]);

  const loadFaqs = async () => {
    try {
      const response = await infoAPI.getTerms();

      if (response.status === 'success') {
        setTerms(response.data);
        // Expand first item by default
        if (response.data.length > 0) {
          setExpandedItems({ [response.data[0].id]: true });
        }
      } else {
        showToastOrAlert(t('Error loading terms'));
      }
    } catch (error) {
      console.error('Error loading terms:', error);
      showToastOrAlert(t('Error loading terms'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fa = i18n.language === 'fa';
  return (
    <View style={styles.screen}>
      <ScreenHeaders title={t("Terms / About Loop")} />
      <DocumentPage
        icon="information-circle-outline"
        title={t("Terms / About Loop")}
        lead={fa ? 'شرایط استفاده از خدمات لوپ و آنچه باید درباره\u200cی ما بدانید.' : 'The terms of Loop’s services and what to know about us.'}
        items={terms}
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
