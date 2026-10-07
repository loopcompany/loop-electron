/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/notes/AddEditNoteScreen.js
 *
 * Writing a note as a desktop editor (@desktop/FormKit): a tall writing
 * area with a live character meter, the save action under it and the tips
 * in the side column.
 *
 * Same logic as the mobile file, copied verbatim (create / update through
 * `notesAPI`, the 2000-character limit, the same validation and messages,
 * back after saving).
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useTranslation } from 'react-i18next';
import ScreenHeaders from "@components/ScreenHeaders";
import { notesAPI } from "@services/Api";
import { showToastOrAlert, showAlert } from "@helpers/Common";

import { DButton, formatNumber, useDir } from '@desktop/ui';
import { Field, FormPage, FormSection, TextField, TipsCard } from '@desktop/FormKit';
import { palette, surface } from '@desktop/desktopTheme';

export default function AddEditNoteScreen({ route, navigation }) {
  const { t, i18n } = useTranslation();
  const dir = useDir();
  const fa = i18n.language === 'fa';
  const noteToEdit = route.params?.note;
  const isEditMode = !!noteToEdit;

  const [noteText, setNoteText] = useState(noteToEdit?.note || '');
  const [loading, setLoading] = useState(false);
  const [charCount, setCharCount] = useState(noteToEdit?.note?.length || 0);

  const MAX_CHARS = 2000;

  useEffect(() => {
    setCharCount(noteText.length);
  }, [noteText]);

  const handleSave = async () => {
    // Validation
    if (!noteText.trim()) {
      showAlert(t('Error'), t('Please enter note text'));
      return;
    }

    if (noteText.length > MAX_CHARS) {
      showAlert(t('Error'), t('Note should not exceed {{count}} characters', { count: MAX_CHARS }));
      return;
    }

    try {
      setLoading(true);
      const payload = { note: noteText.trim() };

      let response;
      if (isEditMode) {
        response = await notesAPI.update(noteToEdit.id, payload);
      } else {
        response = await notesAPI.create(payload);
      }

      if (response.success) {
        showToastOrAlert(
          isEditMode ? t('Note successfully updated') : t('Note successfully saved')
        );
        if (Platform.OS == 'web') {
          window.history.back()
        } else {
          navigation.goBack()
        }
      }
    } catch (error) {
      console.error('Error saving note:', error);

      // Handle validation errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat().join('\n');
        showAlert(t('Error saving'), errorMessages);
      } else if (error.response?.data?.message) {
        showAlert(t('Error'), error.response.data.message);
      } else {
        showToastOrAlert(t('Error saving note'));
      }
    } finally {
      setLoading(false);
    }
  };
  const ratio = Math.min(1, charCount / MAX_CHARS);
  const over = charCount > MAX_CHARS;

  return (
    <View style={styles.screen}>
      <ScreenHeaders title={isEditMode ? t('Edit Note') : t('Add Note')} />
      <FormPage
        hero={{
          icon: isEditMode ? 'create-outline' : 'document-text-outline',
          title: isEditMode ? t('Edit Note') : t('Add Note'),
          subtitle: t('Write your personal notes here. You can record reminders, to-do lists, important information, and anything else you need.'),
          badges: [{ icon: 'lock-closed-outline', label: fa ? 'فقط برای شما' : 'Only for you' }],
        }}
        actions={
          <DButton
            title={isEditMode ? t('Save Changes') : t('Save Note')}
            icon="checkmark-circle-outline"
            variant="gold"
            size="lg"
            onPress={handleSave}
            loading={loading}
            disabled={loading || !noteText.trim() || over}
          />
        }
        aside={
          <TipsCard
            title={fa ? 'نکات مفید' : 'Useful tips'}
            items={
              fa
                ? ['برای ساخت فهرست از خط جدید استفاده کنید', 'می‌توانید از ایموجی‌ها استفاده کنید 😊', 'یادداشت‌های مهم را با عنوان واضح بنویسید', `حداکثر ${formatNumber(MAX_CHARS, 'fa')} نویسه مجاز است`]
                : ['Use new lines to make lists', 'Emojis work too 😊', 'Give important notes a clear title', `Up to ${MAX_CHARS} characters`]
            }
          />
        }
      >
        <FormSection
          index={0}
          icon="pencil-outline"
          title={t('Note Text')}
          right={
            <Text style={[styles.count, dir.bold, over && styles.countOver]}>
              {formatNumber(charCount, dir.lang)} / {formatNumber(MAX_CHARS, dir.lang)}
            </Text>
          }
        >
          <Field full error={over ? t('Character count exceeds limit') : undefined}>
            <TextField
              multiline
              rows={14}
              invalid={over}
              placeholder={t('Write your note here...')}
              value={noteText}
              onChangeText={setNoteText}
              maxLength={MAX_CHARS + 100}
              inputStyle={styles.editor}
            />
          </Field>
          <View style={styles.meter}>
            <View style={[styles.meterFill, { width: `${ratio * 100}%` }, over && styles.meterOver, dir.rtl && styles.meterRtl]} />
          </View>
        </FormSection>
      </FormPage>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  count: { fontSize: 12.5, color: surface.faint },
  countOver: { color: palette.danger },
  editor: { fontSize: 15, lineHeight: 28 },
  meter: { height: 5, borderRadius: 3, backgroundColor: surface.sunken, overflow: 'hidden' },
  meterFill: { height: 5, borderRadius: 3, backgroundColor: palette.brandBright },
  meterOver: { backgroundColor: palette.danger },
  meterRtl: { alignSelf: 'flex-end' },
});
