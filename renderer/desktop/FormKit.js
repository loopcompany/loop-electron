import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { contentGutter, contentMaxWidth } from './Breakpoints';
import { elevation, gradients, motion, onDark, palette, radii, surface } from './desktopTheme';
import { animate } from './globalStyles';
import { formatNumber, useDir } from './ui';

/**
 * Desktop form pages (training registration, service faults, violation
 * reports, feedback, top-up, notes, profile…): one consistent look for every
 * screen whose job is to collect information.
 *
 *   <FormPage hero={…} aside={…} actions={…}>
 *     <FormSection icon title subtitle>
 *       <FieldGrid>
 *         <Field label required error hint><TextField …/></Field>
 *       </FieldGrid>
 *     </FormSection>
 *   </FormPage>
 *
 * The screens keep their own state, validation and requests; these only lay
 * the form out and draw the controls.
 */

/* ---------------------------------------------------------------- layout */

/**
 * @param {object} props
 * @param {{ icon: string, title: string, subtitle?: string, badges?: Array<{icon: string, label: string}> }} props.hero
 * @param {import('react').ReactNode} [props.aside]    side column
 * @param {import('react').ReactNode} [props.actions]  buttons at the end of the form
 * @param {string} [props.actionsHint]
 */
export function FormPage({ hero, aside, actions, actionsHint, children, scrollRef }) {
  const dir = useDir();
  return (
    <ScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.page}>
        <View style={[styles.hero, dir.row, animate('loop-fade-up', '320ms')]}>
          <View style={styles.heroStars} pointerEvents="none" />
          <View style={styles.heroGlow} pointerEvents="none" />
          <View style={styles.heroIcon}>
            <Ionicons name={hero.icon} size={28} color={palette.gold} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.heroTitle, dir.bold, dir.align]}>{hero.title}</Text>
            {!!hero.subtitle && <Text style={[styles.heroSubtitle, dir.light, dir.align]}>{hero.subtitle}</Text>}
          </View>
          {!!hero.badges?.length && (
            <View style={[styles.heroBadges, dir.row]}>
              {hero.badges.map((badge) => (
                <View key={badge.label} style={[styles.heroBadge, dir.row]}>
                  <Ionicons name={badge.icon} size={14} color={palette.gold} />
                  <Text style={[styles.heroBadgeText, dir.light]}>{badge.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.columns, dir.row]}>
          <View style={styles.main}>
            {children}
            {!!actions && (
              <View style={[styles.actionBar, animate('loop-fade-up', '320ms', '160ms')]}>
                {!!actionsHint && (
                  <View style={[styles.actionHint, dir.row]}>
                    <Ionicons name="information-circle-outline" size={16} color={surface.faint} />
                    <Text style={[styles.actionHintText, dir.light, dir.align]}>{actionsHint}</Text>
                  </View>
                )}
                <View style={[styles.actions, dir.row]}>{actions}</View>
              </View>
            )}
          </View>
          {!!aside && <View style={[styles.aside, animate('loop-fade-up', '320ms', '100ms')]}>{aside}</View>}
        </View>
      </View>
    </ScrollView>
  );
}

/** A titled card holding a group of fields. */
export function FormSection({ icon, title, subtitle, children, index = 0, style, right }) {
  const dir = useDir();
  return (
    <View style={[styles.section, animate('loop-fade-up', '320ms', `${60 + index * 50}ms`), style]}>
      {(!!title || !!icon) && (
        <View style={[styles.sectionHead, dir.row]}>
          {!!icon && (
            <View style={styles.sectionIcon}>
              <Ionicons name={icon} size={18} color={palette.brandBright} />
            </View>
          )}
          <View style={styles.flex}>
            {!!title && <Text style={[styles.sectionTitle, dir.bold, dir.align]}>{title}</Text>}
            {!!subtitle && <Text style={[styles.sectionSubtitle, dir.light, dir.align]}>{subtitle}</Text>}
          </View>
          {right}
        </View>
      )}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

/* ---------------------------------------------------------------- fields */

export function FieldGrid({ children, style }) {
  const dir = useDir();
  return <View style={[styles.grid, dir.row, style]}>{children}</View>;
}

/**
 * @param {object} props
 * @param {string} [props.label]
 * @param {boolean} [props.required]
 * @param {string} [props.error]
 * @param {string} [props.hint]
 * @param {boolean} [props.full]     span the whole row of a FieldGrid
 */
export function Field({ label, required, error, hint, full, children, style }) {
  const dir = useDir();
  return (
    <View style={[styles.field, full && styles.full, style]}>
      {!!label && (
        <Text style={[styles.label, dir.bold, dir.align]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      {children}
      {!!error && (
        <View style={[styles.messageRow, dir.row]}>
          <Ionicons name="alert-circle" size={13} color={palette.danger} />
          <Text style={[styles.error, dir.light, dir.align]}>{error}</Text>
        </View>
      )}
      {!error && !!hint && <Text style={[styles.hint, dir.light, dir.align]}>{hint}</Text>}
    </View>
  );
}

/** TextInput in the desktop field box: optional icon, unit/prefix, counter, invalid and read-only states. */
export const TextField = forwardRef(function TextField(
  { icon, unit, invalid, multiline, rows = 4, counter, maxLength, value, style, inputStyle, editable = true, onFocus, onBlur, ...rest },
  ref
) {
  const dir = useDir();
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <View
        style={[
          styles.box,
          dir.row,
          multiline && styles.boxMultiline,
          focused && styles.boxFocused,
          invalid && styles.boxInvalid,
          !editable && styles.boxReadonly,
          style,
        ]}
      >
        {!!icon && (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? palette.brandBright : surface.faint}
            style={multiline ? styles.iconTop : undefined}
          />
        )}
        <TextInput
          ref={ref}
          {...rest}
          value={value}
          maxLength={maxLength}
          editable={editable}
          multiline={multiline}
          numberOfLines={multiline ? rows : undefined}
          placeholderTextColor={surface.faint}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            dir.light,
            dir.align,
            multiline && { height: 'auto', minHeight: rows * 24 + 8 },
            multiline && styles.inputMultiline,
            !editable && styles.inputReadonly,
            inputStyle,
          ]}
        />
        {!!unit && (
          <View style={styles.unit}>
            <Text style={[styles.unitText, dir.bold]}>{unit}</Text>
          </View>
        )}
      </View>
      {counter && !!maxLength && (
        <Text style={[styles.counter, dir.light, { textAlign: dir.rtl ? 'left' : 'right' }]}>
          {formatNumber(String(value || '').length, dir.lang)} / {formatNumber(maxLength, dir.lang)}
        </Text>
      )}
    </View>
  );
});

/** A field-looking button that opens a picker (dates, lists). */
export function SelectField({ icon = 'calendar-outline', value, placeholder, onPress, invalid, chevron = 'chevron-down' }) {
  const dir = useDir();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ hovered }) => [styles.box, dir.row, hovered && styles.boxHover, invalid && styles.boxInvalid]}
    >
      <Ionicons name={icon} size={18} color={value ? palette.brandBright : surface.faint} />
      <Text style={[styles.input, styles.selectText, dir.light, dir.align, !value && styles.placeholder]} numberOfLines={1}>
        {value || placeholder}
      </Text>
      <Ionicons name={chevron} size={15} color={surface.faint} />
    </Pressable>
  );
}

/**
 * Options as cards (single or multiple choice).
 *
 * @param {object} props
 * @param {Array<{value: any, label: string, icon?: string, hint?: string}>} props.options
 * @param {any} props.value                 a value, or an array when `multiple`
 * @param {(value: any) => void} props.onChange
 * @param {boolean} [props.multiple]
 * @param {number} [props.columns]
 */
export function ChoiceGroup({ options, value, onChange, multiple, columns = 2, compact }) {
  const dir = useDir();
  const gap = 10;
  const width = columns === 1 ? '100%' : `calc(${100 / columns}% - ${(gap * (columns - 1)) / columns}px)`;
  const selected = (v) => (multiple ? Array.isArray(value) && value.includes(v) : value === v);
  const toggle = (v) => {
    if (!multiple) return onChange(v);
    const list = Array.isArray(value) ? value : [];
    return onChange(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  };
  return (
    <View style={[styles.choices, dir.row, { gap }]}>
      {options.map((opt) => {
        const on = selected(opt.value);
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => toggle(opt.value)}
            accessibilityRole={multiple ? 'checkbox' : 'radio'}
            accessibilityState={{ checked: on }}
            style={({ hovered, pressed }) => [
              styles.choice,
              compact && styles.choiceCompact,
              dir.row,
              { width },
              hovered && !on && styles.choiceHover,
              pressed && styles.choicePressed,
              on && styles.choiceOn,
            ]}
          >
            <View style={[multiple ? styles.check : styles.radio, on && styles.markOn]}>
              {on && (multiple ? <Ionicons name="checkmark" size={13} color="#ffffff" /> : <View style={styles.radioDot} />)}
            </View>
            {!!opt.icon && <Ionicons name={opt.icon} size={18} color={on ? palette.brandBright : surface.faint} />}
            <View style={styles.flex}>
              <Text style={[styles.choiceText, on ? dir.bold : dir.light, dir.align, on && styles.choiceTextOn]} numberOfLines={2}>
                {opt.label}
              </Text>
              {!!opt.hint && <Text style={[styles.choiceHint, dir.light, dir.align]}>{opt.hint}</Text>}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Small pills that fill a field with a common answer. */
export function QuickChips({ options, value, onPick }) {
  const dir = useDir();
  return (
    <View style={[styles.chips, dir.row]}>
      {options.map((opt) => {
        const on = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onPick(opt)}
            accessibilityRole="button"
            style={({ hovered }) => [styles.chip, hovered && !on && styles.chipHover, on && styles.chipOn]}
          >
            <Text style={[styles.chipText, on ? dir.bold : dir.light, on && styles.chipTextOn]}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({ value, onChange, label, hint, icon }) {
  const dir = useDir();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: !!value }}
      style={({ hovered }) => [styles.toggleRow, dir.row, hovered && styles.toggleRowHover]}
    >
      {!!icon && (
        <View style={styles.sectionIcon}>
          <Ionicons name={icon} size={17} color={palette.brandBright} />
        </View>
      )}
      <View style={styles.flex}>
        <Text style={[styles.toggleLabel, dir.bold, dir.align]}>{label}</Text>
        {!!hint && <Text style={[styles.hint, dir.light, dir.align]}>{hint}</Text>}
      </View>
      <View style={[styles.track, dir.rtl && styles.trackRtl, value && styles.trackOn]}>
        <View style={[styles.thumb, value && (dir.rtl ? styles.thumbOnRtl : styles.thumbOnLtr)]} />
      </View>
    </Pressable>
  );
}

/** A dashed drop zone for picking a file. */
export function UploadBox({ title, hint, fileName, onPress, loading, icon = 'cloud-upload-outline' }) {
  const dir = useDir();
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      style={({ hovered }) => [styles.upload, hovered && styles.uploadHover, !!fileName && styles.uploadDone]}
    >
      <View style={[styles.uploadIcon, !!fileName && styles.uploadIconDone]}>
        <Ionicons name={fileName ? 'document-attach' : icon} size={26} color={fileName ? palette.success : palette.brandBright} />
      </View>
      <Text style={[styles.uploadTitle, dir.bold]} numberOfLines={1}>{fileName || title}</Text>
      {!!hint && <Text style={[styles.uploadHint, dir.light]}>{hint}</Text>}
    </Pressable>
  );
}

/* ---------------------------------------------------------------- aside */

/** Numbered tips in the side column. */
export function TipsCard({ title, icon = 'bulb-outline', items }) {
  const dir = useDir();
  return (
    <View style={styles.tips}>
      <View style={[styles.tipsHead, dir.row]}>
        <View style={styles.tipsIcon}>
          <Ionicons name={icon} size={17} color="#b07a00" />
        </View>
        <Text style={[styles.tipsTitle, dir.bold, dir.align]}>{title}</Text>
      </View>
      {items.map((item, i) => (
        <View key={item} style={[styles.tip, dir.row]}>
          <Text style={[styles.tipNum, dir.bold]}>{formatNumber(i + 1, dir.lang)}</Text>
          <Text style={[styles.tipText, dir.light, dir.align]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

/** A dark card with a message and an action (support, related page). */
export function AsideAction({ icon, title, text, children }) {
  const dir = useDir();
  return (
    <View style={styles.asideAction}>
      <View style={styles.heroStars} pointerEvents="none" />
      <View style={styles.asideIcon}>
        <Ionicons name={icon} size={22} color={palette.gold} />
      </View>
      <Text style={[styles.asideTitle, dir.bold]}>{title}</Text>
      {!!text && <Text style={[styles.asideText, dir.light]}>{text}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  scrollContent: { paddingHorizontal: contentGutter, paddingBottom: 32 },
  page: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', gap: 18 },

  hero: {
    alignItems: 'center',
    gap: 18,
    minHeight: 112,
    paddingHorizontal: 26,
    paddingVertical: 22,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundImage: gradients.hero,
    boxShadow: elevation.floating,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroStars: { ...StyleSheet.absoluteFillObject, backgroundImage: gradients.stars },
  heroGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -120,
    left: -60,
    backgroundImage: 'radial-gradient(circle, rgba(255, 215, 0, 0.16) 0%, rgba(255, 215, 0, 0) 70%)',
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.32)',
    boxShadow: '0 0 30px rgba(255, 215, 0, 0.12)',
  },
  heroTitle: { color: onDark.text, fontSize: 22, lineHeight: 34 },
  heroSubtitle: { color: onDark.soft, fontSize: 13.5, lineHeight: 24, maxWidth: 640 },
  heroBadges: { gap: 8, flexWrap: 'wrap', maxWidth: 380, justifyContent: 'flex-end' },
  heroBadge: {
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heroBadgeText: { color: onDark.soft, fontSize: 12 },

  columns: { gap: 18, alignItems: 'flex-start' },
  main: { flex: 1, minWidth: 0, gap: 16 },
  aside: { width: 330, flexShrink: 0, gap: 16 },

  section: {
    borderRadius: radii.lg,
    backgroundColor: surface.card,
    borderWidth: 1,
    borderColor: surface.border,
    boxShadow: elevation.card,
  },
  sectionHead: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: surface.border,
  },
  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: surface.brandTint,
  },
  sectionTitle: { fontSize: 15.5, color: surface.title },
  sectionSubtitle: { fontSize: 12.5, color: surface.faint, marginTop: 2, lineHeight: 20 },
  sectionBody: { padding: 22, gap: 16 },

  grid: { flexWrap: 'wrap', gap: 16 },
  field: { width: 'calc(50% - 8px)', flexGrow: 1, minWidth: 240, gap: 8 },
  full: { width: '100%' },
  label: { fontSize: 13, color: surface.muted },
  required: { color: palette.danger },
  messageRow: { alignItems: 'center', gap: 5 },
  error: { fontSize: 12, color: palette.danger },
  hint: { fontSize: 11.5, color: surface.faint, lineHeight: 19 },

  box: {
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: surface.borderStrong,
    backgroundColor: surface.card,
    transitionProperty: 'border-color, box-shadow, background-color',
    transitionDuration: motion.fast,
  },
  boxHover: { borderColor: 'rgba(29, 95, 174, 0.45)', cursor: 'pointer' },
  boxMultiline: { alignItems: 'flex-start', paddingVertical: 12 },
  boxFocused: { borderColor: palette.sky, boxShadow: elevation.focus },
  boxInvalid: { borderColor: palette.danger, backgroundColor: 'rgba(214, 69, 69, 0.04)' },
  boxReadonly: { backgroundColor: surface.sunken, borderColor: surface.border },
  iconTop: { marginTop: 2 },
  input: {
    flex: 1,
    minWidth: 0,
    height: 46,
    fontSize: 14,
    color: surface.title,
    outlineStyle: 'none',
    backgroundColor: 'transparent',
  },
  inputMultiline: { lineHeight: 24, paddingVertical: 0, textAlignVertical: 'top' },
  inputReadonly: { color: surface.muted },
  selectText: { lineHeight: 46 },
  placeholder: { color: surface.faint },
  unit: {
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 8,
    justifyContent: 'center',
    backgroundColor: surface.sunken,
  },
  unitText: { fontSize: 12, color: surface.muted },
  counter: { fontSize: 11, color: surface.faint, marginTop: 6 },

  choices: { flexWrap: 'wrap' },
  choice: {
    alignItems: 'center',
    gap: 12,
    minHeight: 54,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: surface.borderStrong,
    backgroundColor: surface.card,
    cursor: 'pointer',
    transitionProperty: 'border-color, background-color, box-shadow, transform',
    transitionDuration: motion.fast,
  },
  choiceCompact: { minHeight: 44, paddingVertical: 6 },
  choiceHover: { borderColor: 'rgba(29, 95, 174, 0.45)', backgroundColor: surface.cardMuted },
  choicePressed: { transform: 'scale(0.99)' },
  choiceOn: { borderColor: palette.brandBright, backgroundColor: surface.brandTint, boxShadow: '0 0 0 3px rgba(79, 143, 224, 0.16)' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: surface.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: surface.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markOn: { borderColor: palette.brandBright, backgroundColor: palette.brandBright },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ffffff' },
  choiceText: { fontSize: 13.5, color: surface.title, lineHeight: 22 },
  choiceTextOn: { color: surface.brandText },
  choiceHint: { fontSize: 11.5, color: surface.faint, marginTop: 1 },

  chips: { flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: surface.borderStrong,
    backgroundColor: surface.card,
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color',
    transitionDuration: motion.fast,
  },
  chipHover: { backgroundColor: surface.cardMuted, borderColor: 'rgba(29, 95, 174, 0.4)' },
  chipOn: { backgroundImage: gradients.brand, borderColor: 'transparent' },
  chipText: { fontSize: 12.5, color: surface.muted },
  chipTextOn: { color: '#ffffff' },

  toggleRow: {
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: surface.border,
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: motion.fast,
  },
  toggleRowHover: { backgroundColor: surface.cardMuted },
  toggleLabel: { fontSize: 13.5, color: surface.title },
  track: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 3,
    backgroundColor: surface.borderStrong,
    transitionProperty: 'background-color',
    transitionDuration: motion.base,
  },
  trackRtl: { alignItems: 'flex-end' },
  trackOn: { backgroundColor: palette.success },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
    transitionProperty: 'transform',
    transitionDuration: motion.base,
  },
  thumbOnRtl: { transform: 'translateX(-20px)' },
  thumbOnLtr: { transform: 'translateX(20px)' },

  upload: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 30,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(29, 95, 174, 0.3)',
    backgroundColor: 'rgba(79, 143, 224, 0.04)',
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color',
    transitionDuration: motion.fast,
  },
  uploadHover: { backgroundColor: 'rgba(79, 143, 224, 0.09)', borderColor: palette.brandBright },
  uploadDone: { borderColor: 'rgba(31, 157, 85, 0.45)', backgroundColor: 'rgba(31, 157, 85, 0.05)' },
  uploadIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: surface.card,
    boxShadow: elevation.card,
  },
  uploadIconDone: { backgroundColor: 'rgba(31, 157, 85, 0.1)' },
  uploadTitle: { fontSize: 14, color: surface.title, maxWidth: '90%' },
  uploadHint: { fontSize: 12, color: surface.faint },

  actionBar: {
    gap: 12,
    padding: 18,
    borderRadius: radii.lg,
    backgroundColor: surface.card,
    borderWidth: 1,
    borderColor: surface.border,
    boxShadow: elevation.raised,
  },
  actionHint: { alignItems: 'center', gap: 8 },
  actionHintText: { flex: 1, fontSize: 12.5, color: surface.faint, lineHeight: 21 },
  actions: { gap: 10, flexWrap: 'wrap', alignItems: 'center' },

  // a solid card (it sits on the wallpaper beside the form), warmed with a gold tint
  tips: {
    padding: 18,
    gap: 12,
    borderRadius: radii.lg,
    backgroundColor: surface.card,
    backgroundImage: 'linear-gradient(160deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.02) 60%)',
    borderWidth: 1,
    borderColor: 'rgba(233, 179, 8, 0.35)',
    boxShadow: elevation.raised,
  },
  tipsHead: { alignItems: 'center', gap: 10 },
  tipsIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  tipsTitle: { flex: 1, fontSize: 14, color: surface.title },
  tip: { alignItems: 'flex-start', gap: 10 },
  tipNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 11.5,
    color: '#7a5600',
    backgroundColor: 'rgba(255, 215, 0, 0.28)',
    overflow: 'hidden',
  },
  tipText: { flex: 1, fontSize: 12.5, lineHeight: 22, color: surface.muted },

  asideAction: {
    alignItems: 'center',
    gap: 8,
    padding: 22,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundImage: gradients.hero,
    boxShadow: elevation.raised,
  },
  asideIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginBottom: 4,
  },
  asideTitle: { color: onDark.text, fontSize: 15, textAlign: 'center' },
  asideText: { color: onDark.soft, fontSize: 12.5, lineHeight: 21, textAlign: 'center', marginBottom: 6 },
});
