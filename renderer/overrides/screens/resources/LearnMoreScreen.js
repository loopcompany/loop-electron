/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/resources/LearnMoreScreen.js
 *
 * The FAQ, as a desktop help page (@desktop/DocumentPage): search, numbered
 * questions, a table of contents and a way to reach support. Same data and
 * behaviour as the mobile file (`infoAPI.getFAQs`, first question open,
 * the same error toast).
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

export default function LearnMoreScreen() {
  const { t, i18n } = useTranslation();
  const [faqs, setFaqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    loadFaqs();
  }, [isRefreshing]);

  const loadFaqs = async () => {
    try {
      const response = await infoAPI.getFAQs();

      if (response.status === 'success') {
        setFaqs(response.data);
        // Expand first item by default
        if (response.data.length > 0) {
          setExpandedItems({ [response.data[0].id]: true });
        }
      } else {
        showToastOrAlert(t('Error loading FAQs'));
      }
    } catch (error) {
      console.error('Error loading faqs:', error);
      showToastOrAlert(t('Error loading FAQs'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fa = i18n.language === 'fa';
  return (
    <View style={styles.screen}>
      <ScreenHeaders title={t("FAQ")} />
      <DocumentPage
        qa
        icon="help-buoy-outline"
        title={t("FAQ")}
        lead={fa ? 'پاسخ پرسش‌های رایج درباره‌ی سفارش، پرداخت و پیگیری خدمات لوپ.' : 'Answers to common questions about ordering, payment and tracking.'}
        items={faqs}
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
