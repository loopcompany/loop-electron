/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/contact/FeedbackSurveyScreen.js
 *
 * The satisfaction survey as a desktop form (@desktop/FormKit): the three
 * things being rated (app, technician, support) as rows of large
 * good / average / poor choices, the comment below, and proper desktop
 * states for loading, errors, "already answered" (with the answers) and
 * "not allowed".
 *
 * Same requests and rules as the mobile file (`pollAPI.canParticipate`,
 * `getMyPoll`, `submitPoll`, the same messages, submit enabled only when all
 * three are rated, retry on error).
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeaders from '@components/ScreenHeaders';
import pollAPI from '@services/PollApi';

import { Card, DButton, EmptyState, Pill, Spinner, useDir } from '@desktop/ui';
import { Field, FormPage, FormSection, TextField, TipsCard } from '@desktop/FormKit';
import { elevation, motion, palette, radii, surface, tone } from '@desktop/desktopTheme';
import { contentGutter, contentMaxWidth } from '@desktop/Breakpoints';

const RATINGS = [
  { value: 'خوب', key: 'Good', icon: 'happy-outline', kind: 'success' },
  { value: 'متوسط', key: 'Average', icon: 'ellipse-outline', kind: 'warning' },
  { value: 'ضعیف', key: 'Poor', icon: 'sad-outline', kind: 'danger' },
];

export default function FeedbackSurveyScreen() {
  const { t, i18n } = useTranslation();
  const dir = useDir();
  const fa = i18n.language === 'fa';
  const [scores, setScores] = useState({
    app: '',
    technician: '',
    support: '',
  });
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const [canParticipate, setCanParticipate] = useState(false);
  const [alreadyPoll, setAlreadyPoll] = useState(null); // poll data if already submitted
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const token = useSelector(state => state.auth.token);

  // Helper function to translate rating values from backend
  const translateRating = (rating) => {
    const ratingMap = {
      'خوب': t('Good'),
      'متوسط': t('Average'),
      'ضعیف': t('Poor')
    };

    return ratingMap[rating] || rating;
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    
    // Check if user is authenticated
    if (!token) {
      if (mounted) {
        setError(t('Please log in to your account first'));
        setLoading(false);
      }
      return;
    }
    
    pollAPI.canParticipate()
      .then((res) => {
        if (!mounted) return;
        if (res.data && res.data.can_participate) {
          setCanParticipate(true);
        } else {
          setCanParticipate(false);
          // Fetch poll result if already participated
          pollAPI.getMyPoll().then((poll) => {
            if (mounted) setAlreadyPoll(poll.data);
          }).catch(() => { });
        }
      })
      .catch((e) => {
        if (mounted) setError(e.message || t('Error communicating with server'));
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [token]);

  const setRating = (key, value) => {
    setScores({ ...scores, [key]: value });
  };

  const handleSubmit = async () => {
    // Check authentication before submitting
    if (!token) {
      setError(t('Please log in to your account first'));
      return;
    }

    setSubmitLoading(true);
    setSubmitSuccess(null);
    setError(null);
    try {
      const pollData = {
        app_rate: scores.app,
        tech_rate: scores.technician,
        support_rate: scores.support,
        description: desc,
      };
      
      console.log('Submitting poll with data:', pollData);
      console.log('User token exists:', !!token);
      
      const res = await pollAPI.submitPoll(pollData);
      setSubmitSuccess(res.message || t('Survey submitted successfully.'));
      setCanParticipate(false);
      // Optionally fetch poll result
      pollAPI.getMyPoll().then((poll) => setAlreadyPoll(poll.data)).catch(() => { });
    } catch (e) {
      console.error('Poll submission error:', e);
      setError(e.message || t('Error submitting survey'));
    } finally {
      setSubmitLoading(false);
    }
  };

  const retry = () => {
    setError(null);
    setLoading(true);
    pollAPI.canParticipate()
      .then((res) => {
        if (res.data && res.data.can_participate) {
          setCanParticipate(true);
        } else {
          setCanParticipate(false);
          pollAPI.getMyPoll().then((poll) => setAlreadyPoll(poll.data)).catch(() => {});
        }
      })
      .catch((e) => setError(e.message || t('Error communicating with server')))
      .finally(() => setLoading(false));
  };

  const subjects = [
    { key: 'app', icon: 'phone-portrait-outline', label: t("Loop Application") },
    { key: 'technician', icon: 'construct-outline', label: t("Loop Technician") },
    { key: 'support', icon: 'headset-outline', label: t("Loop Support") },
  ];
  const answered = ['app', 'technician', 'support'].filter((key) => scores[key]).length;

  const state = (node) => (
    <View style={styles.screen}>
      <ScreenHeaders title={t("Survey / Performance")} />
      <View style={styles.statePage}>
        <Card style={styles.stateCard}>{node}</Card>
      </View>
    </View>
  );

  if (loading) {
    return state(<Spinner label={t("Loading...")} style={styles.stateSpinner} />);
  }

  if (error && !canParticipate) {
    const needsLogin = error.includes('وارد حساب') || error.includes('log in');
    return state(
      <EmptyState
        icon={needsLogin ? 'log-in-outline' : 'cloud-offline-outline'}
        title={t("Error")}
        message={error}
        action={needsLogin ? null : <DButton title={t("Try again")} icon="refresh" onPress={retry} />}
      />
    );
  }

  if (!canParticipate && alreadyPoll) {
    const results = [
      { label: t("Application score:"), value: alreadyPoll.app_rate, icon: 'phone-portrait-outline' },
      { label: t("Technician score:"), value: alreadyPoll.tech_rate, icon: 'construct-outline' },
      { label: t("Support score:"), value: alreadyPoll.support_rate, icon: 'headset-outline' },
    ];
    return state(
      <View style={styles.result}>
        <EmptyState icon="checkmark-done-outline" title={t("You have already participated in the survey")} message={t("Your survey results:")} compact />
        <View style={[styles.resultGrid, dir.row]}>
          {results.map((item) => {
            const rating = RATINGS.find((r) => r.value === item.value);
            return (
              <View key={item.label} style={styles.resultItem}>
                <Ionicons name={item.icon} size={22} color={palette.brandBright} />
                <Text style={[styles.resultLabel, dir.light]}>{item.label}</Text>
                <Pill label={translateRating(item.value)} kind={rating?.kind || 'neutral'} icon={rating?.icon} />
              </View>
            );
          })}
        </View>
        {!!alreadyPoll.description && (
          <View style={styles.quote}>
            <Text style={[styles.quoteLabel, dir.bold, dir.align]}>{t("Your opinion:")}</Text>
            <Text style={[styles.quoteText, dir.light, dir.align]}>{alreadyPoll.description}</Text>
          </View>
        )}
      </View>
    );
  }

  if (!canParticipate) {
    return state(
      <EmptyState
        icon="ban-outline"
        title={t("You are not allowed to participate")}
        message={t("You have already participated in the survey or do not have access.")}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeaders title={t("Survey / Performance")} />
      <FormPage
        hero={{
          icon: 'happy-outline',
          title: t("Survey / Performance"),
          subtitle: t("Dear user, thank you for your trust, please select your satisfaction level with Loop's performance."),
          badges: [{ icon: 'checkmark-circle-outline', label: fa ? `${answered} از ۳ پاسخ` : `${answered} of 3 answered` }],
        }}
        actions={
          <>
            <DButton
              title={submitLoading ? t('Submitting...') : t('Submit Survey')}
              icon="send"
              variant="gold"
              size="lg"
              onPress={handleSubmit}
              disabled={submitLoading || !scores.app || !scores.technician || !scores.support}
              loading={submitLoading}
            />
            {!!submitSuccess && <Pill label={submitSuccess} kind="success" icon="checkmark" />}
            {!!error && <Pill label={error} kind="danger" icon="alert" />}
          </>
        }
        aside={
          <TipsCard
            title={fa ? 'نظر شما چه می‌شود؟' : 'What happens to your answers?'}
            icon="sparkles-outline"
            items={
              fa
                ? ['همه‌ی پاسخ‌ها مستقیم به مدیریت لوپ می‌رسد', 'امتیاز تکنسین‌ها در ارزیابی ماهانه‌شان اثر دارد', 'توضیحات شما به بهبود اپلیکیشن کمک می‌کند']
                : ['Every answer goes straight to Loop’s management', 'Technician scores count in their monthly review', 'Your comments help us improve the app']
            }
          />
        }
      >
        <FormSection index={0} icon="star-outline" title={fa ? 'میزان رضایت شما' : 'How satisfied are you?'} subtitle={fa ? 'برای هر مورد یک گزینه انتخاب کنید' : 'Pick one option for each'}>
          {subjects.map((subject) => (
            <View key={subject.key} style={[styles.rateRow, dir.row]}>
              <View style={[styles.subject, dir.row]}>
                <View style={styles.subjectIcon}>
                  <Ionicons name={subject.icon} size={20} color={palette.brandBright} />
                </View>
                <Text style={[styles.subjectText, dir.bold, dir.align]}>{subject.label}</Text>
              </View>
              <View style={[styles.rates, dir.row]}>
                {RATINGS.map((rating) => {
                  const on = scores[subject.key] === rating.value;
                  const c = tone[rating.kind];
                  return (
                    <Pressable
                      key={rating.value}
                      onPress={() => setRating(subject.key, rating.value)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on }}
                      style={({ hovered }) => [
                        styles.rate,
                        dir.row,
                        hovered && !on && styles.rateHover,
                        on && { backgroundColor: c.bg, borderColor: c.fg, boxShadow: `0 0 0 3px ${c.bg}` },
                      ]}
                    >
                      <Ionicons name={on ? rating.icon.replace('-outline', '') : rating.icon} size={20} color={on ? c.fg : surface.faint} />
                      <Text style={[styles.rateText, on ? dir.bold : dir.light, on && { color: c.fg }]}>{t(rating.key)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </FormSection>

        <FormSection index={1} icon="chatbox-ellipses-outline" title={t("Do you have more details? Write:")}>
          <Field full>
            <TextField icon="create-outline" multiline rows={5} placeholder={t("Details...")} value={desc} onChangeText={setDesc} />
          </Field>
        </FormSection>
      </FormPage>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  statePage: { flex: 1, paddingHorizontal: contentGutter, paddingBottom: 32, width: '100%', maxWidth: contentMaxWidth + contentGutter * 2, alignSelf: 'center' },
  stateCard: { minHeight: 360, justifyContent: 'center' },
  stateSpinner: { paddingVertical: 80 },
  result: { gap: 16 },
  resultGrid: { gap: 14 },
  resultItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    padding: 18,
    borderRadius: radii.lg,
    backgroundColor: surface.cardMuted,
    borderWidth: 1,
    borderColor: surface.border,
  },
  resultLabel: { fontSize: 13, color: surface.muted },
  quote: { padding: 16, gap: 6, borderRadius: radii.md, backgroundColor: surface.cardMuted, borderStartWidth: 3, borderColor: palette.gold },
  quoteLabel: { fontSize: 12.5, color: palette.brandBright },
  quoteText: { fontSize: 13.5, lineHeight: 24, color: surface.title },

  rateRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: surface.border,
  },
  subject: { alignItems: 'center', gap: 12, flexShrink: 1 },
  subjectIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: surface.brandTint },
  subjectText: { fontSize: 14.5, color: surface.title },
  rates: { gap: 8 },
  rate: {
    alignItems: 'center',
    gap: 8,
    height: 46,
    minWidth: 112,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: surface.borderStrong,
    backgroundColor: surface.card,
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color, box-shadow',
    transitionDuration: motion.fast,
  },
  rateHover: { backgroundColor: surface.cardMuted, borderColor: 'rgba(29, 95, 174, 0.4)' },
  rateText: { fontSize: 13.5, color: surface.muted },
});
