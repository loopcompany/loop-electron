/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/resources/OrganizationTermsScreen.js
 *
 * The organisation terms, as a desktop reading page (@desktop/DocumentPage): search,
 * numbered sections, a table of contents and a way to reach support. Same
 * data and behaviour as the mobile file (`infoAPI.getOrganizationTerms`, first section
 * open, the same error toast, the terms PDF button).
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { useSelector } from 'react-redux';
import { imageUri } from '@services/URL';
import { useTranslation } from 'react-i18next';
import ScreenHeaders from '@components/ScreenHeaders';
import { infoAPI } from '@services/Api';
import { showToastOrAlert } from '@helpers/Common';
import BlankScreen from '@components/BlankScreen';

import DocumentPage from '@desktop/DocumentPage';
import { DButton } from '@desktop/ui';

export default function OrganizationTermsScreen() {
  const { t, i18n } = useTranslation();
  const [terms, setTerms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const pdf = useSelector(state => state.pdf?.data)

  useEffect(() => {
    loadFaqs();
  }, [isRefreshing]);

  const loadFaqs = async () => {
    try {
      const response = await infoAPI.getOrganizationTerms();

      if (response.status === 'success') {
        setTerms(response.data);
        // Expand first item by default
        if (response.data.length > 0) {
          setExpandedItems({ [response.data[0].id]: true });
        }
      } else {
        showToastOrAlert(t('Error loading organization terms and conditions'));
      }
    } catch (error) {
      console.error('Error loading terms:', error);
      showToastOrAlert(t('Error loading organization terms and conditions'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fa = i18n.language === 'fa';
  return (
    <View style={styles.screen}>
      <ScreenHeaders title={t("Organization Terms and Conditions")} />
      <DocumentPage
        icon="business-outline"
        title={t("Organization Terms and Conditions")}
        lead={fa ? 'شرایط و ضوابط استفاده از پنل سازمانی و شرکتی لوپ.' : 'The terms of the Loop organisation panel.'}
        items={terms}
        expanded={expandedItems}
        setExpanded={setExpandedItems}
        loading={isLoading}
        refreshing={isRefreshing}
        onRefresh={() => setIsRefreshing(true)}
        empty={<BlankScreen />}
        footer={
          <DButton
            title={t("PDF of organizational terms and conditions")}
            icon="document-attach-outline"
            variant="outline"
            size="lg"
            style={styles.pdf}
            onPress={() => {
              Linking.openURL(`${imageUri}/${pdf?.organ_term}`)
            }}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  pdf: { alignSelf: 'flex-start', marginTop: 6 },
});
