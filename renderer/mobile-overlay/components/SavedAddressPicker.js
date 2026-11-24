import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { SelectableOptions } from '@components/OrgSelectionKit';
import Button from '@components/Button';
import { fetchAddresses } from '@slices/addressSlice';
import NewStyles from '@styles/NewStyles';
import { spacing } from '@theme/Spacing';
import { L } from '@org/orgI18n';

// بیشینه‌ی ارتفاع فهرست آدرس‌ها. تا ۱۴۰۵/۰۹/۰۲ فهرست بدون محدوده بود و با آدرس‌های
// زیاد مرحله‌ی «آدرس‌های منتخب» بسیار بلند می‌شد؛ در نسخه‌ی ویندوز هم نشانگری نبود که
// بگوید این بخش اسکرول می‌شود (درخواست کارفرما: «توی انتخاب آدرس بتونه اسکرول کنه»
// و «نوار اسکرول باریک ظریف کنارش باشه»). حالا فهرست درون خودش اسکرول می‌شود و
// نشانگر روشن است؛ دکمه‌ی «مدیریت آدرس‌ها» همیشه در دید می‌ماند.
const LIST_MAX_HEIGHT = 360;

export default function SavedAddressPicker({ value, onChange, navigation }) {
  const token = useSelector((state) => state.auth.token);
  const addresses = useSelector((state) => state.address.data);
  const loading = useSelector((state) => state.address.loading);
  const dispatch = useDispatch();

  useFocusEffect(useCallback(() => {
    if (token) dispatch(fetchAddresses(token));
  }, [dispatch, token]));

  const options = Array.isArray(addresses) ? addresses.map((entry) => ({
    id: String(entry.id),
    title: [entry.title, entry.address].filter(Boolean).join(' — '),
  })) : [];

  return (
    <>
      {options.length > 0 ? (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator
        >
          <SelectableOptions options={options} value={value == null ? null : String(value)} onChange={onChange} columns={1} />
        </ScrollView>
      ) : null}
      {!loading && options.length === 0 && (
        <Text style={NewStyles.text10}>{L('ابتدا یک آدرس ثبت کنید.')}</Text>
      )}
      <Button title={L('مدیریت آدرس‌ها')} onPress={() => navigation.navigate('AddressScreen')} />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    maxHeight: LIST_MAX_HEIGHT,
  },
  // کمی فاصله تا آیتم آخر زیر نوار اسکرول پنهان نشود
  listContent: {
    paddingBottom: spacing.xs,
  },
});
