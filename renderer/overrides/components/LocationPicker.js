/**
 * DESKTOP OVERRIDE of loop-customer-mobile/components/LocationPicker.js
 *
 * The region picker as a desktop field: the trigger is a FormKit select
 * field and the list opens in a centred, searchable dialog instead of a phone
 * bottom sheet. On the glass sign-up card the trigger becomes a glass field
 * (`data-loop-select`, AUTH_CSS).
 *
 * Everything above "Render picker button" (loading provinces / cities /
 * regions, caching, the selection handlers and the search filter) is the
 * mobile file verbatim.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uri } from '@services/URL';
import { showAlert, langIsRTL } from '@helpers/Common';
import NewStyles from '@styles/NewStyles';
import { createStyles } from '@styles/NewStyles';
import { themeColor10, themeColor3, themeColor4 } from '@theme/Color';

import { Pressable, StyleSheet } from 'react-native';
import Dialog from '@desktop/Dialog';
import { SelectField } from '@desktop/FormKit';
import { radii, surface, palette } from '@desktop/desktopTheme';
import { useDir } from '@desktop/ui';

/**
 * LocationPicker Component
 * A reusable component for selecting Province, City, and Region
 * 
 * Props:
 * - selectedProvince: {id, title} - Currently selected province
 * - selectedCity: {id, title} - Currently selected city
 * - selectedRegion: {id, title} - Currently selected region
 * - onProvinceChange: (province) => void - Callback when province changes
 * - onCityChange: (city) => void - Callback when city changes
 * - onRegionChange: (region) => void - Callback when region changes
 * - errors: {province, city, region} - Error messages for each field
 * - required: boolean - Whether fields are required (shows *)
 */
const LocationPicker = ({
  selectedProvince,
  selectedCity,
  selectedRegion,
  onProvinceChange,
  onCityChange,
  onRegionChange,
  errors = {},
  required = true,
  style = {}
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = langIsRTL(i18n.language);
  const NewStyles = useMemo(
    () => createStyles(i18n.language),
    [i18n.language]
  ); 
  // const styles = useMemo(()=> createLocalStyles(NewStyles), [NewStyles]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [regions, setRegions] = useState([]);

  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingRegions, setLoadingRegions] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  // Load provinces on mount
  // useEffect(() => {
  //   fetchProvinces();
  // }, []);

  // Load cities when province changes
  // useEffect(() => {
  //   if (selectedProvince?.id) {
  //     fetchCities(selectedProvince.id);
  //   } else {
  //     setCities([]);
  //     setRegions([]);
  //   }
  // }, [selectedProvince?.id]);

  // Load regions when city changes
  useEffect(() => {
    // if (selectedCity?.id) {
    fetchRegions(1);
    // } else {
    //   setRegions([]);
    // }
  }, []);

  // Fetch all provinces
  const fetchProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = {
        'Accept': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.get(`${uri}/locations/provinces`, { headers });
      if (response.data.success) {
        setProvinces(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
      if (Platform.OS === 'web') {
        window.alert(t('Error fetching province list'));
      } else {
        showAlert(t('Error'), t('Error fetching province list'));
      }
    } finally {
      setLoadingProvinces(false);
    }
  };

  // Fetch cities for a province
  const fetchCities = async (provinceId) => {
    setLoadingCities(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = {
        'Accept': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.get(`${uri}/locations/provinces/${provinceId}/cities`, { headers });
      if (response.data.success) {
        setCities(response.data.data.cities);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([]);
    } finally {
      setLoadingCities(false);
    }
  };

  // Fetch regions for a city
  const fetchRegions = async (cityId) => {
    setLoadingRegions(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const headers = {
        'Accept': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.get(`${uri}/locations/cities/${cityId}/regions`, { headers });
      if (response.data.success) {
        setRegions(response.data.data.regions);
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
      setRegions([]);
    } finally {
      setLoadingRegions(false);
    }
  };

  // Handle province selection
  const handleProvinceSelect = (province) => {
    onProvinceChange(province);
    // Reset city and region when province changes
    onCityChange(null);
    onRegionChange(null);
    setShowProvinceModal(false);
    setSearchQuery('');
  };

  // Handle city selection
  const handleCitySelect = (city) => {
    onCityChange(city);
    // Reset region when city changes
    onRegionChange(null);
    setShowCityModal(false);
    setSearchQuery('');
  };

  // Handle region selection
  const handleRegionSelect = (region) => {
    onRegionChange(region);
    setShowRegionModal(false);
    setSearchQuery('');
  };

  // Filter items based on search query
  const filterItems = (items) => {
    if (!searchQuery) return items;
    return items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const dir = useDir();

  // Render picker button
  const renderPickerButton = (label, selectedItem, onPress, error, disabled = false) => (
    <View style={[{ gap: 6 }, style]}>
      <View dataSet={{ loopSelect: '' }} style={disabled && { opacity: 0.55, pointerEvents: 'none' }}>
        <SelectField
          icon="location-outline"
          value={selectedItem ? selectedItem.title : ''}
          placeholder={`${label}${required ? ' *' : ''}`}
          onPress={disabled ? undefined : onPress}
          invalid={!!error}
        />
      </View>
      {error && <Text style={[desk.error, dir.light, dir.align]}>{error}</Text>}
    </View>
  );

  // Render selection modal
  const renderModal = (visible, onClose, items, onSelect, loading, title) => {
    const list = filterItems(items);
    return (
      <Dialog visible={visible} onClose={onClose} icon="location-outline" title={title} width={480}>
        <View style={[desk.search, dir.row]}>
          <Ionicons name="search" size={17} color={surface.faint} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('Search...')}
            placeholderTextColor={surface.faint}
            autoFocus
            style={[NewStyles.text10, desk.searchInput, dir.align]}
          />
        </View>
        {loading ? (
          <View style={desk.state}>
            <ActivityIndicator size="large" color={palette.brandBright} />
          </View>
        ) : list.length === 0 ? (
          <View style={desk.state}>
            <Ionicons name="map-outline" size={30} color={surface.faint} />
            <Text style={[desk.stateText, dir.light]}>{t('No results found.')}</Text>
          </View>
        ) : (
          <ScrollView style={desk.list} contentContainerStyle={{ gap: 4 }}>
            {list.map((item) => {
              const on = selectedRegion?.id === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => onSelect(item)}
                  style={({ hovered }) => [desk.item, dir.row, hovered && desk.itemHover, on && desk.itemOn]}
                >
                  <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={18} color={on ? palette.brandBright : surface.faint} />
                  <Text style={[desk.itemText, on ? dir.bold : dir.light, dir.align]} numberOfLines={1}>{item.title}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </Dialog>
    );
  };

  return (
    <View>
      {/* Region Picker */}
      {renderPickerButton(
        t('Region'),
        selectedRegion,
        () => setShowRegionModal(true),
        errors.region,
        false
      )}
      {renderModal(
        showRegionModal,
        () => { setShowRegionModal(false); setSearchQuery(''); },
        regions,
        handleRegionSelect,
        loadingRegions,
        t('Select region')
      )}
    </View>
  );
};

const desk = StyleSheet.create({
  error: { fontSize: 12, color: palette.danger },
  search: {
    alignItems: 'center',
    gap: 10,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: surface.borderStrong,
    backgroundColor: surface.sunken,
  },
  searchInput: { flex: 1, minWidth: 0, height: 44, fontSize: 14, color: surface.title, outlineStyle: 'none', backgroundColor: 'transparent' },
  list: { maxHeight: 360, marginHorizontal: -6 },
  item: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    cursor: 'pointer',
  },
  itemHover: { backgroundColor: surface.hover },
  itemOn: { backgroundColor: 'var(--loop-brand-tint)' },
  itemText: { flex: 1, fontSize: 14, color: surface.title },
  state: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 36 },
  stateText: { fontSize: 13.5, color: surface.muted },
});

export default LocationPicker;
