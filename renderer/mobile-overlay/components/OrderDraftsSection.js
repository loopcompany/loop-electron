// بخش «پیش‌نویس‌ها» بالای فهرست سفارشات.
//
// سفارش نیمه‌کاره‌ی مسیرهای سازمانی (services/orderDrafts.js) اینجا با دو دکمه
// نمایش داده می‌شود: «ادامه» همان صفحه‌ی مراحل را با همان انتخاب‌ها باز می‌کند و
// «حذف» پیش‌نویس را پاک می‌کند. بدون پیش‌نویس، چیزی رندر نمی‌شود.
import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { DRAFT_SOURCE, deleteDraft, draftOwnerKey, listDrafts } from '@services/orderDrafts';
import { formatDateTime, langIsRTL, showAlert } from '@helpers/Common';
import { colors } from '@theme/Color';
import { spacing } from '@theme/Spacing';
import { radius } from '@theme/Radius';
import { fontSize, getFontFamily } from '@theme/Typography';
import { shadow } from '@theme/Shadows';

const resumeTarget = (draft) => {
  if (draft.source === DRAFT_SOURCE.SYSTEMATIC && draft.categoryId) {
    return {
      name: 'SystematicDeviceScreen',
      params: {
        categoryId: draft.categoryId,
        categoryTitle: draft.categoryTitle ?? undefined,
        backendCategoryId: draft.backendCategoryId ?? null,
        draftId: draft.id,
      },
    };
  }
  if (draft.source === DRAFT_SOURCE.COMPREHENSIVE) {
    return { name: 'ComprehensiveSelectionScreen', params: { draftId: draft.id } };
  }
  return null;
};

export default function OrderDraftsSection({ navigation }) {
  const { t, i18n } = useTranslation();
  const rtl = langIsRTL(i18n.language);
  const user = useSelector((state) => state?.user?.data);
  const userType = useSelector((state) => state?.auth?.userType);
  const ownerKey = draftOwnerKey(user, userType);
  const [drafts, setDrafts] = useState([]);

  // با هر بار نمایش صفحه دوباره خوانده می‌شود: ممکن است کاربر همین حالا
  // سفارشی را ثبت (پیش‌نویسش پاک شده) یا پیش‌نویس تازه‌ای ساخته باشد.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listDrafts(ownerKey).then((list) => {
        if (!cancelled) setDrafts(list.filter((draft) => resumeTarget(draft)));
      });
      return () => {
        cancelled = true;
      };
    }, [ownerKey])
  );

  if (drafts.length === 0) return null;

  const handleDelete = (draft) => {
    showAlert(t('Delete draft'), t('Are you sure you want to delete this draft order?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteDraft(ownerKey, draft.id);
          setDrafts((prev) => prev.filter((item) => item.id !== draft.id));
        },
      },
    ]);
  };

  const textAlign = rtl ? 'right' : 'left';
  const rowDirection = rtl ? 'row-reverse' : 'row';

  return (
    <View style={{ width: '90%', alignSelf: 'center', gap: spacing.sm, backgroundColor:'#10213d',padding:16,borderRadius:14 }}>
      <Text
        style={{
          fontFamily: getFontFamily('bold', i18n.language),
          fontSize: fontSize.md,
          color: '#f7f2e7',
          textAlign,
        }}
      >
        {t('Draft orders')}
      </Text>
      <Text
        style={{
          fontFamily: getFontFamily('regular', i18n.language),
          fontSize: fontSize.xs,
          color: '#d6e1f3',
          textAlign,
        }}
      >
        {t('These orders have not been submitted yet. Continue where you left off.')}
      </Text>
      {drafts.map((draft) => (
        <View
          key={draft.id}
          style={{
            backgroundColor: colors.surface.bgColor(1),
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.warning.bgColor(0.6),
            padding: spacing.md,
            gap: spacing.sm,
            ...shadow.sm,
          }}
        >
          <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: spacing.sm }}>
            <Ionicons name="document-text-outline" size={20} color={colors.warning.color} />
            <Text
              style={{
                flex: 1,
                fontFamily: getFontFamily('bold', i18n.language),
                fontSize: fontSize.sm,
                color: colors.textPrimary.color,
                textAlign,
              }}
              numberOfLines={2}
            >
              {draft.title || t('Draft order')}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: getFontFamily('regular', i18n.language),
              fontSize: fontSize.xs,
              color: colors.textMuted.color,
              textAlign,
            }}
          >
            {t('Last edited')}: {draft.updatedAt ? formatDateTime(new Date(draft.updatedAt).toISOString()) : '-'}
          </Text>
          <View style={{ flexDirection: rowDirection, gap: spacing.sm }}>
            <TouchableOpacity
              onPress={() => {
                const target = resumeTarget(draft);
                if (target) navigation.navigate(target.name, target.params);
              }}
              style={{
                flex: 1,
                alignItems: 'center',
                backgroundColor: colors.primary.bgColor(1),
                borderRadius: radius.sm,
                paddingVertical: spacing.sm,
              }}
            >
              <Text style={{ fontFamily: getFontFamily('bold', i18n.language), fontSize: fontSize.sm, color: colors.white.color }}>
                {t('Continue order')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(draft)}
              style={{
                flex: 1,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.error.bgColor(1),
                borderRadius: radius.sm,
                paddingVertical: spacing.sm,
              }}
            >
              <Text style={{ fontFamily: getFontFamily('bold', i18n.language), fontSize: fontSize.sm, color: colors.error.color }}>
                {t('Delete')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}
