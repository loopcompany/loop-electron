import React, { useCallback } from 'react';
import { Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { SelectableOptions } from '@components/OrgSelectionKit';
import Button from '@components/Button';
import { fetchAddresses } from '@slices/addressSlice';
import NewStyles from '@styles/NewStyles';
import { L } from '@org/orgI18n';

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
      <SelectableOptions options={options} value={value == null ? null : String(value)} onChange={onChange} columns={1} />
      {!loading && options.length === 0 && (
        <Text style={NewStyles.text10}>{L('ابتدا یک آدرس ثبت کنید.')}</Text>
      )}
      <Button title={L('مدیریت آدرس‌ها')} onPress={() => navigation.navigate('AddressScreen')} />
    </>
  );
}
