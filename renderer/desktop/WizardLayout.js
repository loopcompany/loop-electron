import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import HintBadge from '@components/HintBadge';

import Dialog from './Dialog';
import { elevation, gradients, motion, onDark, palette, radii, surface } from './desktopTheme';
import { animate } from './globalStyles';
import { Cheetah, DButton, cheetahFacing, formatNumber, useDir } from './ui';
import { contentGutter, contentMaxWidth } from './Breakpoints';
import { tip } from './tooltip';

const COPY = {
  fa: {
    progress: (n, total) => `${n} از ${total} مرحله تکمیل شده`,
    stepOf: (n, total) => `مرحله‌ی ${n} از ${total}`,
    steps: 'مراحل سفارش',
    prev: 'مرحله‌ی قبل',
    next: 'مرحله‌ی بعد',
    required: 'الزامی',
    summary: 'خلاصه‌ی سفارش',
    summaryEmpty: 'با تکمیل هر مرحله، انتخاب‌هایتان اینجا نمایش داده می‌شود.',
    draft: 'پیش‌نویس به‌صورت خودکار ذخیره می‌شود',
    showSummary: 'خلاصه‌ی سفارش',
  },
  en: {
    progress: (n, total) => `${n} of ${total} steps complete`,
    stepOf: (n, total) => `Step ${n} of ${total}`,
    steps: 'Order steps',
    prev: 'Previous',
    next: 'Next step',
    required: 'Required',
    summary: 'Order summary',
    summaryEmpty: 'Your choices show up here as you complete each step.',
    draft: 'Your draft is saved automatically',
    showSummary: 'Order summary',
  },
};

/**
 * Summary lines come one per chosen item (the order description and the
 * price matching need them that way); on screen, consecutive lines with the
 * same label are shown as one row listing all the values.
 *
 * @param {Array<{label: string, value: any}>} lines
 * @param {boolean} rtl
 */
export function groupSummaryLines(lines, rtl) {
  const sep = rtl ? '، ' : ', ';
  return lines.reduce((rows, line) => {
    const last = rows[rows.length - 1];
    if (last && last.label === line.label && typeof line.value === 'string' && typeof last.value === 'string') {
      rows[rows.length - 1] = { ...last, value: `${last.value}${sep}${line.value}` };
    } else {
      rows.push(line);
    }
    return rows;
  }, []);
}

/**
 * The desktop frame for the step-by-step order flows (systematic,
 * comprehensive): the steps as a vertical stepper, the current step in a
 * large card with Previous / Next, and a live summary of the choices so far.
 * On a phone the same flows are one long accordion.
 *
 * The flow owns its state; this only lays it out.
 *
 * When the page is narrow (small window, open sidebar) the stepper folds into
 * a rail of numbered dots (names on hover), the summary moves into its dialog
 * and the footer drops its dots, so the step itself keeps the room it needs.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {any} [props.image]            category artwork (require'd)
 * @param {Array<{id: string, title: string, hint?: string, icon?: any, done: boolean, required?: boolean}>} props.steps
 * @param {string} props.currentId
 * @param {(id: string) => void} props.onSelect
 * @param {number} props.filledCount
 * @param {import('react').ReactNode} props.children   body of the current step
 * @param {{ title: string, lines: Array<{label: string, value: any}> }} [props.summary]
 */
export default function WizardLayout({ title, subtitle, image, steps, currentId, onSelect, filledCount, children, summary }) {
  const dir = useDir();
  const copy = COPY[dir.rtl ? 'fa' : 'en'];
  const { height } = useWindowDimensions();
  const [pageWidth, setPageWidth] = useState(0);
  const [mainWidth, setMainWidth] = useState(0);
  const compact = pageWidth > 0 && pageWidth < COMPACT_BELOW;
  const footerDots = !mainWidth || mainWidth >= FOOTER_DOTS_FROM;
  // the summary sits under the stepper; short windows and the folded rail move it into a dialog
  const showSummary = !!summary && height >= 640 && !compact;
  const bodyRef = useRef(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const index = Math.max(0, steps.findIndex((step) => step.id === currentId));
  const current = steps[index];
  const total = steps.length;
  const progress = total ? filledCount / total : 0;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  // a new step starts at its top
  useEffect(() => {
    bodyRef.current?.scrollTo?.({ y: 0, animated: false });
  }, [currentId]);

  const n = (value) => formatNumber(value, dir.lang);

  const summaryLines = (light) =>
    summary.lines.length === 0 ? (
      <Text style={[styles.summaryEmpty, light && styles.onLight, dir.light]}>{copy.summaryEmpty}</Text>
    ) : (
      groupSummaryLines(summary.lines, dir.rtl).map((line, i) => (
        <View key={i} style={[styles.summaryLine, light && styles.summaryLineLight, dir.row]}>
          <Text style={[styles.summaryLabel, light && styles.summaryLabelLight, dir.light, dir.align]}>{line.label}</Text>
          <Text style={[styles.summaryValue, light && styles.summaryValueLight, dir.bold, { textAlign: dir.rtl ? 'left' : 'right' }]} numberOfLines={4}>
            {typeof line.value === 'number' ? n(line.value) : String(line.value ?? '')}
          </Text>
        </View>
      ))
    );

  return (
    <View style={styles.page} onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}>
      {/* Header */}
      <View style={[styles.hero, dir.row, animate('loop-fade-up', '320ms')]}>
        <View style={styles.heroStars} pointerEvents="none" />
        {!!image && (
          <View style={styles.heroImageWrap}>
            <Image source={image} style={styles.heroImage} resizeMode="contain" />
          </View>
        )}
        <View style={styles.heroText}>
          {!!subtitle && <Text style={[styles.heroSubtitle, dir.light, dir.align]}>{subtitle}</Text>}
          <Text style={[styles.heroTitle, dir.bold, dir.align]} numberOfLines={1}>{title}</Text>
        </View>
        <View style={[styles.progressBlock, compact && styles.progressBlockCompact]}>
          <View style={[styles.progressLabelRow, dir.row]}>
            <Text style={[styles.progressText, dir.light]}>{copy.progress(n(filledCount), n(total))}</Text>
            <Text style={[styles.progressPct, dir.bold]}>{n(Math.round(progress * 100))}٪</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }, dir.rtl && styles.progressFillRtl]} />
          </View>
          <View style={[styles.draftRow, dir.row]}>
            <Ionicons name="cloud-done-outline" size={13} color={onDark.muted} />
            <Text style={[styles.draftText, dir.light]}>{copy.draft}</Text>
          </View>
        </View>
        {!!summary && !showSummary && (
          <DButton
            title={copy.showSummary}
            icon="document-text-outline"
            variant="glass"
            size="sm"
            onPress={() => setSummaryOpen(true)}
          />
        )}
      </View>

      {!!summary && (
        <Dialog
          visible={summaryOpen && !showSummary}
          onClose={() => setSummaryOpen(false)}
          title={summary.title || copy.summary}
          icon="document-text-outline"
          width={560}
        >
          <ScrollView style={styles.summaryDialog}>{summaryLines(true)}</ScrollView>
        </Dialog>
      )}

      <View style={[styles.columns, dir.row]}>
        {/* Steps, and the live summary under them */}
        <View style={[styles.side, compact && styles.sideCompact]}>
        {/* Stepper */}
        <View style={[styles.stepper, compact && styles.stepperCompact, animate('loop-fade-up', '340ms', '60ms')]}>
          {!compact && <Text style={[styles.stepperTitle, dir.bold, dir.align]}>{copy.steps}</Text>}
          <ScrollView style={styles.flex} contentContainerStyle={styles.stepperList} showsVerticalScrollIndicator={false}>
            {steps.map((step, i) => {
              const active = step.id === currentId;
              return (
                <Pressable
                  key={step.id}
                  onPress={() => onSelect(step.id)}
                  accessibilityRole="tab"
                  accessibilityLabel={step.title}
                  accessibilityState={{ selected: active }}
                  {...tip(compact ? step.title : null)}
                  style={({ hovered }) => [
                    styles.step,
                    dir.row,
                    compact && styles.stepCompact,
                    hovered && !active && styles.stepHover,
                    active && styles.stepActive,
                  ]}
                >
                  {i < total - 1 && (
                    <View
                      style={[
                        styles.rail,
                        compact ? styles.railCompact : dir.rtl ? styles.railRtl : styles.railLtr,
                        step.done && styles.railDone,
                      ]}
                    />
                  )}
                  <View style={[styles.dot, step.done && styles.dotDone, active && !step.done && styles.dotActive]}>
                    {step.done ? (
                      <Ionicons name="checkmark" size={14} color={palette.white} />
                    ) : (
                      <Text style={[styles.dotText, dir.bold, active && styles.dotTextActive]}>{n(i + 1)}</Text>
                    )}
                  </View>
                  {!compact && (
                    <View style={styles.flex}>
                      <Text style={[styles.stepTitle, active ? dir.bold : dir.light, dir.align, active && styles.stepTitleActive]} numberOfLines={2}>
                        {step.title}
                      </Text>
                      {step.required && !step.done && (
                        <Text style={[styles.stepRequired, dir.light, dir.align]}>{copy.required}</Text>
                      )}
                    </View>
                  )}
                  {!!step.icon && !compact && (
                    <View style={[styles.stepIconChip, !active && styles.stepIconDim]}>
                      <Image source={step.icon} style={styles.stepIcon} resizeMode="contain" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Live summary */}
          {showSummary && (
          <View style={[styles.summary, animate('loop-fade-up', '340ms', '140ms')]}>
            <View style={[styles.summaryHead, dir.row]}>
              <View style={styles.summaryIcon}>
                <Ionicons name="document-text-outline" size={18} color={palette.gold} />
              </View>
              <Text style={[styles.summaryTitle, dir.bold, dir.align]} numberOfLines={2}>
                {summary.title || copy.summary}
              </Text>
            </View>
            <ScrollView style={styles.flex} contentContainerStyle={styles.summaryList} showsVerticalScrollIndicator={false}>
              {summaryLines(false)}
            </ScrollView>
          </View>
        )}
        </View>

        {/* Current step */}
        <View
          style={[styles.main, animate('loop-fade-up', '340ms', '100ms')]}
          onLayout={(e) => setMainWidth(e.nativeEvent.layout.width)}
        >
          {current && (
            <View style={[styles.mainHeader, dir.row]}>
              {!!current.icon && (
                <View style={styles.mainIconWrap}>
                  <Image source={current.icon} style={styles.mainIcon} resizeMode="contain" />
                </View>
              )}
              <View style={styles.flex} key={current.id}>
                <Text style={[styles.stepOf, dir.light, dir.align]}>{copy.stepOf(n(index + 1), n(total))}</Text>
                <Text style={[styles.mainTitle, dir.bold, dir.align, animate('loop-fade-up', '240ms')]}>{current.title}</Text>
              </View>
              {!!current.hint && <HintBadge hint={current.hint} title={current.title} size={24} />}
            </View>
          )}
          <ScrollView ref={bodyRef} style={styles.flex} contentContainerStyle={styles.body}>
            <View key={currentId} style={animate('loop-fade-in', '220ms')}>
              {children}
            </View>
          </ScrollView>
          <View style={[styles.mainFooter, dir.row]}>
            <DButton
              title={copy.prev}
              icon={<Cheetah facing={cheetahFacing(dir.rtl, 'back')} height={34} />}
              variant="outline"
              size="lg"
              disabled={isFirst}
              onPress={() => onSelect(steps[index - 1].id)}
            />
            {footerDots ? (
              <View style={[styles.dots, dir.row]}>
                {steps.map((step) => (
                  <View
                    key={step.id}
                    style={[styles.miniDot, step.done && styles.miniDotDone, step.id === currentId && styles.miniDotActive]}
                  />
                ))}
              </View>
            ) : (
              <Text style={[styles.footerStep, dir.bold]}>{copy.stepOf(n(index + 1), n(total))}</Text>
            )}
            {!isLast ? (
              <DButton
                title={copy.next}
                iconAfter={<Cheetah facing={cheetahFacing(dir.rtl, 'next')} height={34} />}
                variant="gold"
                size="lg"
                onPress={() => onSelect(steps[index + 1].id)}
              />
            ) : (
              <View style={styles.footerSpacer} />
            )}
          </View>
        </View>

      </View>
    </View>
  );
}

/** Page width (px) below which the stepper folds into a rail of numbered dots. */
const COMPACT_BELOW = 900;
/** Step card width (px) from which the footer has room for one dot per step. */
const FOOTER_DOTS_FROM = 620;

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0, minHeight: 0 },
  page: {
    flex: 1,
    minHeight: 0,
    gap: 16,
    paddingHorizontal: contentGutter,
    paddingBottom: 24,
    width: '100%',
    maxWidth: contentMaxWidth + contentGutter * 2,
    alignSelf: 'center',
  },

  hero: {
    alignItems: 'center',
    gap: 18,
    minHeight: 96,
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundImage: gradients.hero,
    boxShadow: elevation.floating,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroStars: { ...StyleSheet.absoluteFillObject, backgroundImage: gradients.stars },
  heroImageWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    boxShadow: '0 0 26px rgba(79, 143, 224, 0.35)',
  },
  heroImage: { width: 60, height: 60, borderRadius: 16 },
  heroText: { flex: 1, minWidth: 0, gap: 2 },
  heroSubtitle: { color: palette.gold, fontSize: 12.5 },
  heroTitle: { color: onDark.text, fontSize: 22, lineHeight: 34 },
  progressBlock: { width: 320, gap: 8 },
  progressBlockCompact: { width: 220 },
  progressLabelRow: { alignItems: 'center', justifyContent: 'space-between' },
  progressText: { color: onDark.soft, fontSize: 12.5 },
  progressPct: { color: palette.gold, fontSize: 14 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  progressFill: {
    height: 8,
    borderRadius: 4,
    backgroundImage: gradients.gold,
    boxShadow: '0 0 12px rgba(255, 215, 0, 0.6)',
    transitionProperty: 'width',
    transitionDuration: motion.slow,
  },
  progressFillRtl: { alignSelf: 'flex-end' },
  draftRow: { alignItems: 'center', gap: 6 },
  draftText: { color: onDark.muted, fontSize: 11 },

  columns: { flex: 1, minHeight: 0, gap: 16, alignItems: 'stretch' },

  side: { width: 310, flexShrink: 0, gap: 12, minHeight: 0 },
  sideCompact: { width: 64 },
  stepper: {
    flex: 1.4,
    minHeight: 0,
    padding: 14,
    paddingBottom: 6,
    borderRadius: radii.lg,
    backgroundColor: surface.card,
    borderWidth: 1,
    borderColor: surface.border,
    boxShadow: elevation.card,
  },
  stepperCompact: { paddingHorizontal: 8, paddingTop: 10 },
  stepperTitle: { fontSize: 13, color: surface.faint, paddingHorizontal: 6, paddingBottom: 10 },
  stepperList: { gap: 2, paddingBottom: 8 },
  step: {
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radii.md,
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: motion.fast,
  },
  stepCompact: { justifyContent: 'center', paddingHorizontal: 0, minHeight: 44 },
  stepHover: { backgroundColor: surface.cardMuted },
  stepActive: { backgroundColor: 'rgba(29, 95, 174, 0.08)' },
  rail: { position: 'absolute', top: 40, bottom: -14, width: 2, backgroundColor: surface.border },
  railRtl: { right: 21 },
  railLtr: { left: 21 },
  railCompact: { top: 36, bottom: -8, left: '50%', marginLeft: -1 },
  railDone: { backgroundColor: 'rgba(31, 157, 85, 0.45)' },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: surface.sunken,
    borderWidth: 1,
    borderColor: surface.border,
    zIndex: 1,
  },
  dotDone: { backgroundColor: palette.success, borderColor: palette.success },
  dotActive: { backgroundImage: gradients.brand, borderColor: palette.brand, boxShadow: '0 0 0 4px rgba(29, 95, 174, 0.15)' },
  dotText: { fontSize: 12, color: surface.muted },
  dotTextActive: { color: palette.white },
  stepTitle: { fontSize: 13, color: surface.muted, lineHeight: 20 },
  stepTitleActive: { color: surface.title },
  stepRequired: { fontSize: 10.5, color: palette.warning },
  stepIconChip: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.navy800 },
  stepIcon: { width: 24, height: 24 },
  stepIconDim: { opacity: 0.55 },

  main: {
    flex: 1,
    minWidth: 0,
    borderRadius: radii.lg,
    backgroundColor: surface.card,
    borderWidth: 1,
    borderColor: surface.border,
    boxShadow: elevation.raised,
    overflow: 'hidden',
  },
  mainHeader: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: surface.border,
  },
  mainIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.navy800,
    boxShadow: '0 6px 16px rgba(0, 43, 84, 0.25)',
  },
  mainIcon: { width: 40, height: 40 },
  stepOf: { fontSize: 12, color: palette.brandBright },
  mainTitle: { fontSize: 19, color: surface.title, lineHeight: 30 },
  body: { padding: 24, paddingBottom: 32 },
  mainFooter: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: surface.border,
    backgroundColor: surface.cardMuted,
  },
  dots: { gap: 5, flexWrap: 'wrap', justifyContent: 'center', flexShrink: 1 },
  miniDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: surface.borderStrong },
  miniDotDone: { backgroundColor: palette.success },
  miniDotActive: { width: 20, backgroundColor: palette.brandBright },
  footerSpacer: { width: 120 },
  footerStep: { flexShrink: 1, fontSize: 12.5, color: surface.muted, textAlign: 'center' },

  summary: {
    flex: 1,
    minHeight: 0,
    padding: 18,
    gap: 12,
    borderRadius: radii.lg,
    backgroundImage: gradients.hero,
    boxShadow: elevation.raised,
  },
  summaryHead: { alignItems: 'center', gap: 10 },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
  },
  summaryTitle: { flex: 1, color: onDark.text, fontSize: 14 },
  summaryList: { gap: 2 },
  summaryEmpty: { color: onDark.muted, fontSize: 12.5, lineHeight: 22, textAlign: 'center', paddingVertical: 24 },
  summaryLine: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  summaryLabel: { flex: 1, color: onDark.soft, fontSize: 12.5, lineHeight: 20 },
  summaryValue: { maxWidth: '55%', color: palette.gold, fontSize: 12.5, lineHeight: 20 },
  summaryDialog: { maxHeight: 420 },
  onLight: { color: surface.faint },
  summaryLineLight: { borderBottomColor: surface.border },
  summaryLabelLight: { color: surface.muted },
  summaryValueLight: { color: surface.brandText },
});
