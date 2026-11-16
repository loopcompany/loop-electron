import { View, Text, Pressable, Image } from 'react-native';
import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import NewStyles from '@styles/NewStyles';
import { themeColor0, themeColor1, themeColor10, themeColor3, themeColor4, themeColor6 } from '@theme/Color';
import { setMaleCount, setFemaleCount, setUnspecifiedCount, setGeneralData } from '@slices/stepSlice';
import { imageUri } from '@services/URL';
import { LinearGradient } from 'expo-linear-gradient';

export default function Gender({ step, data }) {

    const { t } = useTranslation();
    const dispatch = useDispatch();
    const femaleCount = useSelector(state => state.step?.femaleCount);
    const maleCount = useSelector(state => state.step?.maleCount);
    const unspecifiedCount = useSelector(state => state.step?.unspecifiedCount);

    useEffect(() => {
        if (femaleCount > 0) {
            dispatch(setFemaleCount(0));
            dispatch(setMaleCount(1));
        }
    }, [femaleCount, dispatch]);

    return (
        <View style={NewStyles.seperator1}>
            <View
                style={[NewStyles.center, {
                    backgroundColor: themeColor0.bgColor(1),
                    paddingVertical: 10,
                    ...NewStyles.border10
                }]}

            >
                <View style={[NewStyles.row, { gap: 10 }]}>
                    <Image
                        source={{ uri: `${imageUri}/${data?.icon_name}` }}
                        style={{ height: 50, width: 50, resizeMode: 'contain' }}
                    />
                    <Text style={NewStyles.title4}>{data?.title} {data?.is_required == '1' && <Text style={NewStyles.title6}>*</Text>}</Text>
                </View>
            </View>
            {data?.des &&

                <LinearGradient colors={[themeColor4.bgColor(1), themeColor3.bgColor(1)]} style={[{ alignSelf: 'center', backgroundColor: themeColor3.bgColor(1), paddingHorizontal: 40, paddingVertical: 10, borderWidth: 1, borderColor: themeColor4.bgColor(1), gap: 5, maxWidth: '100%' }, NewStyles.border10, NewStyles.row]}>
                    <Ionicons
                        name={'help-circle-outline'}
                        size={20}
                        color={themeColor10.bgColor(1)}
                    />
                    <Text style={[NewStyles.title10, { fontSize: 12 }]}>{data?.des}</Text>
                </LinearGradient>
            }

            {data?.is_required == 1 && <Pressable
                onPress={() => {
                    dispatch(setMaleCount(1));
                    dispatch(setFemaleCount(0));
                    dispatch(setUnspecifiedCount(0));
                    dispatch(setGeneralData({ fieldId: data?.id, value: 1, step }));
                }}
                style={[NewStyles.border5, {
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: maleCount === 1 ? themeColor0.bgColor(0.1) : themeColor4.bgColor(1),
                    marginBottom: 10
                }]}
            >
                <Text style={[NewStyles.text3, { color: maleCount === 1 ? themeColor0.bgColor(1) : themeColor0.bgColor(1) }]}>{t('Male Technician')}</Text>
            </Pressable>
            }
            {data?.is_required == 1 && <Pressable
                disabled
                accessibilityState={{ disabled: true }}
                style={[NewStyles.border5, {
                    paddingHorizontal: 16,
                    opacity: 0.45,
                    paddingVertical: 12,
                    backgroundColor: femaleCount === 1 ? themeColor0.bgColor(0.1) : themeColor4.bgColor(1)
                }]}
            >
                <Text style={[NewStyles.text3, { color: femaleCount === 1 ? themeColor0.bgColor(1) : themeColor0.bgColor(1) }]}>{t('Female Technician')} ({t('Coming soon')})</Text>
            </Pressable>}
        </View>
    )
}