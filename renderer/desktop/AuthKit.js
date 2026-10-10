/**
 * Desktop sign-in / sign-up forms.
 *
 * The auth screens sit in the frosted-glass card of the `auth` layout
 * (MenuContext `authColumn`, beside @desktop/DesktopAuthPanel). These are the
 * controls they are built from, drawn for that dark glass and for a mouse and
 * keyboard: labelled fields with a gold focus ring, Enter submits, the
 * captcha and the one-time code are single controls, and errors show inline
 * instead of in browser `alert()` boxes.
 *
 *   <AuthScreen>
 *     <AccountSwitch value="individual" onChange={…} />
 *     <AuthHeader title subtitle />
 *     <AuthField label required error><AuthInput icon … /></AuthField>
 *     <SubmitButton title loading onPress />
 *     <AuthFooter text link onPress />
 *   </AuthScreen>
 *
 * The screens keep their own state, validation and requests (they are the
 * mobile files with the markup replaced); these only draw.
 *
 * Every TextInput here carries `data-loop-field`, which keeps it out of the
 * generic glass CSS that still restyles the auth screens not redrawn yet
 * (AUTH_CSS in ./glassAuth).
 */
import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { gradients, motion, onDark, palette, radii } from './desktopTheme';
import { animate } from './globalStyles';
import { useDir } from './ui';

/**
 * Colours on the glass card. Fields are dark inset wells rather than
 * see-through white, so the box, the text and the placeholder all stand out
 * against the frosted card and the wallpaper behind it.
 */
const glass = {
  field: 'rgba(2, 10, 22, 0.58)',
  fieldHover: 'rgba(2, 10, 22, 0.7)',
  fieldFocus: 'rgba(4, 16, 34, 0.86)',
  border: 'rgba(160, 192, 235, 0.28)',
  borderHover: 'rgba(190, 215, 250, 0.5)',
  focus: 'rgba(255, 215, 0, 0.95)',
  focusRing: '0 0 0 4px rgba(255, 215, 0, 0.16), 0 0 24px rgba(255, 215, 0, 0.12)',
  inset: 'inset 0 2px 6px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.02)',
  danger: '#ff9a9a',
  dangerBorder: 'rgba(255, 120, 120, 0.85)',
  dangerRing: '0 0 0 4px rgba(255, 107, 107, 0.16)',
  placeholder: 'rgba(226, 234, 247, 0.6)',
  icon: 'rgba(226, 234, 247, 0.72)',
  hairline: 'rgba(255, 255, 255, 0.1)',
};

/** Persian / Arabic digits → ASCII, so numbers typed on a Persian keyboard validate. */
export const toLatinDigits = (value) =>
  String(value ?? '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

/* ---------------------------------------------------------------- frame */

/**
 * The scrolling body of the card. `wide` for long forms (the card itself is
 * widened by the `authWide` layout).
 */
export function AuthScreen({ children, wide, scrollRef }) {
  return (
    <ScrollView
      ref={scrollRef}
      dataSet={{ loopKit: '', loopDark: '' }}
      style={styles.flex}
      contentContainerStyle={[styles.scroll, wide && styles.scrollWide]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.body, wide && styles.bodyWide]}>{children}</View>
    </ScrollView>
  );
}

/**
 * Title block. `icon` draws a gold tile beside the title (verification
 * steps); the sign-in forms go without one.
 */
export function AuthHeader({ icon, eyebrow, title, subtitle, children }) {
  const dir = useDir();
  return (
    <View style={[styles.header, animate('loop-fade-up', '360ms', '60ms')]}>
      {!!icon && (
        <View style={[styles.headerIcon, { alignSelf: dir.rtl ? 'flex-end' : 'flex-start' }]}>
          <Ionicons name={icon} size={26} color={palette.gold} />
        </View>
      )}
      {!!eyebrow && <Text style={[styles.eyebrow, dir.bold, dir.align]}>{eyebrow}</Text>}
      <Text style={[styles.title, dir.bold, dir.align]}>{title}</Text>
      {!!subtitle && <Text style={[styles.subtitle, dir.light, dir.align]}>{subtitle}</Text>}
      {children}
    </View>
  );
}

const ACCOUNT_COPY = {
  fa: { individual: 'حساب شخصی', organization: 'سازمان / شرکت' },
  en: { individual: 'Personal', organization: 'Organisation / Company' },
};

/**
 * Personal ↔ organisation switch at the top of the sign-in and sign-up
 * cards; each side is a different screen, so `onChange` navigates.
 *
 * @param {object} props
 * @param {'individual'|'organization'} props.value
 * @param {(value: 'individual'|'organization') => void} props.onChange
 */
export function AccountSwitch({ value, onChange, disabled }) {
  const dir = useDir();
  const copy = ACCOUNT_COPY[dir.rtl ? 'fa' : 'en'];
  const options = [
    { value: 'individual', icon: 'person-outline', label: copy.individual },
    { value: 'organization', icon: 'business-outline', label: copy.organization },
  ];
  return (
    <View accessibilityRole="tablist" style={[styles.switch, dir.row, animate('loop-fade-up', '360ms')]}>
      {options.map((opt) => {
        const on = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on, disabled: !!disabled }}
            disabled={disabled}
            onPress={() => !on && onChange(opt.value)}
            style={({ hovered }) => [styles.switchOption, dir.row, on && styles.switchOn, hovered && !on && styles.switchHover]}
          >
            <Ionicons name={opt.icon} size={16} color={on ? palette.gold : onDark.muted} />
            <Text style={[styles.switchText, on ? dir.bold : dir.light, on && styles.switchTextOn]} numberOfLines={1}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A titled group of fields in a long form (organisation sign-up). */
export function AuthSection({ icon, title, subtitle, index = 0, children }) {
  const dir = useDir();
  return (
    <View style={[styles.section, animate('loop-fade-up', '360ms', `${120 + index * 60}ms`)]}>
      <View style={[styles.sectionHead, dir.row]}>
        {!!icon && (
          <View style={styles.sectionIcon}>
            <Ionicons name={icon} size={17} color={palette.gold} />
          </View>
        )}
        <View style={styles.flex}>
          <Text style={[styles.sectionTitle, dir.bold, dir.align]}>{title}</Text>
          {!!subtitle && <Text style={[styles.sectionSubtitle, dir.light, dir.align]}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

/** Fields side by side; each AuthField takes half a row unless `full`. */
export function AuthGrid({ children }) {
  const dir = useDir();
  return <View style={[styles.grid, dir.row]}>{children}</View>;
}

/** The fields of a short form, with the entrance stagger. */
export function AuthFields({ children }) {
  return <View style={[styles.fields, animate('loop-fade-up', '380ms', '120ms')]}>{children}</View>;
}

/* ---------------------------------------------------------------- fields */

/**
 * Label, control, then its error (or hint).
 *
 * @param {object} props
 * @param {string} [props.label]
 * @param {boolean} [props.required]
 * @param {string} [props.error]
 * @param {string} [props.hint]
 * @param {import('react').ReactNode} [props.aside]  at the end of the label row (e.g. "Forgot password?")
 * @param {boolean} [props.full]   whole row of an AuthGrid
 * @param {boolean} [props.half]   half a row of an AuthGrid
 */
export function AuthField({ label, required, error, hint, aside, full, half, children }) {
  const dir = useDir();
  return (
    <View style={[styles.field, half && styles.half, full && styles.full]}>
      {(!!label || !!aside) && (
        <View style={[styles.labelRow, dir.row]}>
          {!!label && (
            <Text style={[styles.label, dir.bold, dir.align]}>
              {label}
              {required && <Text style={styles.required}> *</Text>}
            </Text>
          )}
          {aside}
        </View>
      )}
      {children}
      {!!error && <FieldError>{error}</FieldError>}
      {!error && !!hint && <Text style={[styles.hint, dir.light, dir.align]}>{hint}</Text>}
    </View>
  );
}

export function FieldError({ children }) {
  const dir = useDir();
  return (
    <View style={[styles.errorRow, dir.row, animate('loop-fade-in', '160ms')]}>
      <Ionicons name="alert-circle" size={14} color={glass.danger} />
      <Text style={[styles.errorText, dir.light, dir.align]}>{children}</Text>
    </View>
  );
}

/**
 * A text input in a glass box.
 *
 * @param {object} props
 * @param {string} [props.icon]
 * @param {boolean} [props.invalid]
 * @param {string} [props.prefix]   fixed text before the value (e.g. "021-"), always on the left: numbers read LTR
 * @param {boolean} [props.ltr]     value is typed left-to-right (phone, email, codes)
 * @param {boolean} [props.digits]  a number: Persian / Arabic digits are typed as ASCII
 * @param {import('react').ReactNode} [props.trailing]
 */
export const AuthInput = forwardRef(function AuthInput(
  { icon, invalid, prefix, ltr, digits, trailing, multiline, rows = 3, style, inputStyle, onFocus, onBlur, onChangeText, ...rest },
  ref
) {
  const dir = useDir();
  const [focused, setFocused] = useState(false);
  return (
    <FieldBox focused={focused} invalid={invalid} multiline={multiline} style={style}>
      {!!icon && (
        <Ionicons
          name={icon}
          size={18}
          color={focused ? palette.gold : invalid ? glass.danger : glass.icon}
          style={multiline ? styles.iconTop : undefined}
        />
      )}
      <View style={[styles.inputWrap, { flexDirection: 'row' }]}>
        {!!prefix && <Text style={[styles.prefix, dir.bold]}>{prefix}</Text>}
        <TextInput
          ref={ref}
          dataSet={{ loopField: '' }}
          placeholderTextColor={glass.placeholder}
          multiline={multiline}
          numberOfLines={multiline ? rows : undefined}
          {...rest}
          onChangeText={digits && onChangeText ? (text) => onChangeText(toLatinDigits(text)) : onChangeText}
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
            ltr ? styles.ltrInput : dir.align,
            // keep an RTL placeholder right-aligned while an LTR field is empty
            ltr && dir.rtl && !rest.value && styles.ltrEmptyRtl,
            multiline && { height: rows * 26 + 12, paddingVertical: 12, lineHeight: 26, textAlignVertical: 'top' },
            inputStyle,
          ]}
        />
      </View>
      {trailing}
    </FieldBox>
  );
});

/** The glass box around a field; also used by non-text controls that should look like one. */
function FieldBox({ focused, invalid, multiline, style, children }) {
  const dir = useDir();
  const [hovered, setHovered] = useState(false);
  return (
    <View
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={[
        styles.box,
        dir.row,
        multiline && styles.boxMultiline,
        hovered && styles.boxHover,
        focused && styles.boxFocus,
        invalid && styles.boxInvalid,
        invalid && focused && styles.boxInvalidFocus,
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** AuthInput with a show / hide toggle. */
export const PasswordInput = forwardRef(function PasswordInput({ icon = 'lock-closed-outline', ...rest }, ref) {
  const dir = useDir();
  const [visible, setVisible] = useState(false);
  const label = dir.rtl ? (visible ? 'پنهان کردن رمز' : 'نمایش رمز') : visible ? 'Hide password' : 'Show password';
  return (
    <AuthInput
      ref={ref}
      icon={icon}
      ltr
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      {...rest}
      trailing={
        <Pressable
          onPress={() => setVisible((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={label}
          // the toggle shouldn't take the Tab stop between the password and the next field
          focusable={false}
          style={({ hovered }) => [styles.trailingButton, hovered && styles.trailingButtonHover]}
        >
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={19} color={onDark.soft} />
        </Pressable>
      }
    />
  );
});

const CAPTCHA_COPY = {
  fa: { label: 'کد امنیتی', placeholder: 'کد روبه‌رو را وارد کنید', refresh: 'کد جدید' },
  en: { label: 'Security code', placeholder: 'Type the code shown', refresh: 'New code' },
};

/**
 * The security code: the code to copy and a refresh beside the input, as one
 * control. The code's characters are tilted a little so it reads as a
 * captcha, not as a value the form already filled in.
 */
export function CaptchaField({ code, value, onChangeText, onRefresh, error, onSubmitEditing, uppercase, half }) {
  const dir = useDir();
  const copy = CAPTCHA_COPY[dir.rtl ? 'fa' : 'en'];
  return (
    <AuthField label={copy.label} required error={error} half={half}>
      <View style={[styles.captchaRow, dir.row]}>
        <View style={styles.flex}>
          <AuthInput
            icon="shield-checkmark-outline"
            ltr
            value={value}
            digits={!uppercase}
            onChangeText={(text) => onChangeText(uppercase ? toLatinDigits(text).toUpperCase() : text)}
            placeholder={copy.placeholder}
            maxLength={String(code).length}
            autoCapitalize={uppercase ? 'characters' : 'none'}
            autoCorrect={false}
            inputMode={uppercase ? 'text' : 'numeric'}
            invalid={!!error}
            onSubmitEditing={onSubmitEditing}
            inputStyle={!!value && styles.captchaInput}
          />
        </View>
        <Pressable
          onPress={onRefresh}
          accessibilityRole="button"
          accessibilityLabel={copy.refresh}
          focusable={false}
          style={({ hovered }) => [styles.captchaChip, hovered && styles.captchaChipHover]}
        >
          {({ hovered }) => (
            <>
              <View style={styles.captchaNoise} pointerEvents="none" />
              <View style={styles.captchaChars}>
                {String(code)
                  .split('')
                  .map((ch, i) => (
                    <Text
                      key={`${ch}-${i}`}
                      selectable={false}
                      style={[styles.captchaChar, { transform: [{ rotate: `${TILT[i % TILT.length]}deg` }, { translateY: LIFT[i % LIFT.length] }] }]}
                    >
                      {ch}
                    </Text>
                  ))}
              </View>
              <View style={[styles.captchaRefresh, hovered && styles.captchaRefreshHover]}>
                <Ionicons name="refresh" size={15} color={palette.navy900} />
              </View>
            </>
          )}
        </Pressable>
      </View>
    </AuthField>
  );
}

const TILT = [-8, 6, -4, 9, -6];
const LIFT = [-1, 2, 0, -2, 1];

/**
 * A checkbox with a label; `children` may hold inline links.
 */
export function CheckRow({ checked, onChange, children, invalid, style }) {
  const dir = useDir();
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!checked }}
      style={({ hovered }) => [styles.checkRow, dir.row, hovered && styles.checkRowHover, style]}
    >
      <View style={[styles.checkbox, checked && styles.checkboxOn, invalid && !checked && styles.checkboxInvalid]}>
        {checked && <Ionicons name="checkmark" size={14} color={palette.navy900} />}
      </View>
      <Text style={[styles.checkText, dir.light, dir.align]}>{children}</Text>
    </Pressable>
  );
}

/** Inline link inside a CheckRow / paragraph. */
export function InlineLink({ children, onPress }) {
  const dir = useDir();
  return (
    <Text
      onPress={(e) => {
        e?.stopPropagation?.();
        onPress();
      }}
      accessibilityRole="link"
      style={[styles.inlineLink, dir.bold]}
    >
      {children}
    </Text>
  );
}

/** A small text button (e.g. "Forgot password?" beside the password label). */
export function TextLink({ title, onPress, icon, disabled, muted }) {
  const dir = useDir();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="link"
      style={({ hovered }) => [styles.textLink, dir.row, hovered && !disabled && styles.textLinkHover, disabled && styles.disabled]}
    >
      {!!icon && <Ionicons name={icon} size={14} color={muted ? onDark.soft : palette.gold} />}
      <Text style={[styles.textLinkText, dir.bold, muted && styles.textLinkMuted]}>{title}</Text>
    </Pressable>
  );
}

/**
 * Options as glass cards (single choice), e.g. the organisation type.
 *
 * @param {object} props
 * @param {Array<{value: string, label: string, icon?: string}>} props.options
 */
export function ChoiceCards({ options, value, onChange }) {
  const dir = useDir();
  return (
    <View accessibilityRole="radiogroup" style={[styles.choices, dir.row]}>
      {options.map((opt) => {
        const on = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            style={({ hovered }) => [styles.choice, hovered && !on && styles.choiceHover, on && styles.choiceOn]}
          >
            <View style={[styles.choiceIcon, on && styles.choiceIconOn]}>
              <Ionicons name={opt.icon} size={19} color={on ? palette.navy900 : palette.gold} />
            </View>
            <Text style={[styles.choiceText, on ? dir.bold : dir.light, on && styles.choiceTextOn]} numberOfLines={2}>
              {opt.label}
            </Text>
            {on && (
              <View style={[styles.choiceTick, dir.rtl ? styles.choiceTickRtl : styles.choiceTickLtr]}>
                <Ionicons name="checkmark" size={11} color={palette.navy900} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/** A field-looking button that opens a picker (the birth date). */
export function PickerInput({ icon = 'calendar-outline', value, placeholder, onPress, invalid }) {
  const dir = useDir();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.pickerPress}>
      <FieldBox invalid={invalid}>
        <Ionicons name={icon} size={18} color={value ? palette.gold : invalid ? glass.danger : onDark.muted} />
        <Text style={[styles.input, styles.pickerText, dir.light, dir.align, !value && styles.pickerPlaceholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={15} color={onDark.muted} />
      </FieldBox>
    </Pressable>
  );
}

/** Round logo / photo picker with a line of text beside it. */
export function AvatarPicker({ uri, title, hint, onPress, onRemove, removeLabel }) {
  const dir = useDir();
  return (
    <View style={[styles.avatarRow, dir.row]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={({ hovered }) => [styles.avatar, hovered && styles.avatarHover]}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.avatarImage} />
        ) : (
          <Ionicons name="business" size={30} color="rgba(255, 215, 0, 0.75)" />
        )}
        <View style={styles.avatarBadge}>
          <Ionicons name={uri ? 'swap-horizontal' : 'camera'} size={13} color={palette.navy900} />
        </View>
      </Pressable>
      <View style={[styles.flex, dir.start]}>
        <Text style={[styles.avatarTitle, dir.bold, dir.align]}>{title}</Text>
        {!!hint && <Text style={[styles.hint, dir.light, dir.align]}>{hint}</Text>}
        {!!uri && !!onRemove && <TextLink title={removeLabel} icon="trash-outline" onPress={onRemove} muted />}
      </View>
    </View>
  );
}

/* ---------------------------------------------------------------- one-time code */

/**
 * Six code cells backed by one real input, so typing, Backspace and pasting a
 * whole code all just work. Digits read left-to-right in both languages.
 */
export function OtpInput({ value, onChangeText, length = 6, invalid, disabled, autoFocus = true }) {
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const active = Math.min(value.length, length - 1);
  return (
    <Pressable onPress={() => inputRef.current?.focus()} style={[styles.otp, animate('loop-fade-up', '380ms', '140ms')]}>
      {Array.from({ length }).map((_, i) => {
        const filled = i < value.length;
        const current = focused && i === active && !disabled;
        return (
          <View
            key={i}
            style={[
              styles.otpCell,
              filled && styles.otpCellFilled,
              current && styles.otpCellActive,
              invalid && styles.otpCellInvalid,
            ]}
          >
            <Text style={styles.otpDigit}>{value[i] || ''}</Text>
            {current && !filled && <View style={styles.otpCaret} />}
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        dataSet={{ loopField: '' }}
        value={value}
        onChangeText={onChangeText}
        maxLength={length}
        editable={!disabled}
        inputMode="numeric"
        autoComplete="one-time-code"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        caretHidden
        style={styles.otpHidden}
      />
    </Pressable>
  );
}

const RESEND_COPY = {
  fa: { wait: 'ارسال دوباره‌ی کد تا', resend: 'ارسال دوباره‌ی کد', notReceived: 'کد را دریافت نکردید؟' },
  en: { wait: 'You can resend the code in', resend: 'Resend code', notReceived: "Didn't get the code?" },
};

/** Under a code input: the countdown, then a "resend" link once it runs out. */
export function ResendRow({ seconds, onResend, loading }) {
  const dir = useDir();
  const copy = RESEND_COPY[dir.rtl ? 'fa' : 'en'];
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return (
    <View style={[styles.resend, dir.row]}>
      {seconds > 0 ? (
        <>
          <Ionicons name="time-outline" size={16} color={onDark.muted} />
          <Text style={[styles.footerText, dir.light]}>{copy.wait}</Text>
          <Text style={styles.resendClock}>{`${mm}:${ss}`}</Text>
        </>
      ) : loading ? (
        <ActivityIndicator size="small" color={palette.gold} />
      ) : (
        <>
          <Text style={[styles.footerText, dir.light]}>{copy.notReceived}</Text>
          <TextLink title={copy.resend} icon="refresh" onPress={onResend} />
        </>
      )}
    </View>
  );
}

/* ---------------------------------------------------------------- feedback & actions */

const ALERT_TONES = {
  error: { icon: 'alert-circle', fg: '#ffb4b4', bg: 'rgba(255, 92, 92, 0.12)', border: 'rgba(255, 120, 120, 0.35)' },
  warning: { icon: 'warning', fg: '#ffd97a', bg: 'rgba(255, 193, 7, 0.1)', border: 'rgba(255, 193, 7, 0.32)' },
  info: { icon: 'information-circle', fg: '#bcd6ff', bg: 'rgba(79, 143, 224, 0.14)', border: 'rgba(79, 143, 224, 0.35)' },
  success: { icon: 'checkmark-circle', fg: '#9ff0c2', bg: 'rgba(31, 157, 85, 0.14)', border: 'rgba(31, 157, 85, 0.4)' },
};

/** A message across the form: a server error, a lockout warning, a hint. */
export function AuthAlert({ kind = 'error', title, children, action }) {
  const dir = useDir();
  const c = ALERT_TONES[kind] || ALERT_TONES.error;
  return (
    <View
      accessibilityRole="alert"
      style={[styles.alert, dir.row, { backgroundColor: c.bg, borderColor: c.border }, animate('loop-pop', '220ms')]}
    >
      <Ionicons name={c.icon} size={19} color={c.fg} style={styles.alertIcon} />
      <View style={styles.flex}>
        {!!title && <Text style={[styles.alertTitle, dir.bold, dir.align, { color: c.fg }]}>{title}</Text>}
        {!!children && <Text style={[styles.alertText, dir.light, dir.align]}>{children}</Text>}
        {action}
      </View>
    </View>
  );
}

/**
 * The form's main action: gold, full width.
 *
 * @param {string} [props.icon]  after the title; 'forward' is an arrow in reading direction
 * @param {'gold'|'glass'} [props.variant]
 */
export function SubmitButton({ title, onPress, loading, disabled, icon, variant = 'gold', style }) {
  const dir = useDir();
  const inactive = disabled || loading;
  const gold = variant === 'gold';
  const iconName = icon === 'forward' ? (dir.rtl ? 'arrow-back' : 'arrow-forward') : icon;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ hovered, pressed }) => [
        styles.submit,
        dir.row,
        gold ? styles.submitGold : styles.submitGlass,
        hovered && !inactive && (gold ? styles.submitGoldHover : styles.submitGlassHover),
        pressed && !inactive && styles.submitPressed,
        disabled && !loading && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={gold ? palette.navy900 : palette.white} />
      ) : (
        <>
          <Text style={[styles.submitText, dir.bold, !gold && styles.submitTextGlass]}>{title}</Text>
          {!!iconName && <Ionicons name={iconName} size={18} color={gold ? palette.navy900 : palette.white} />}
        </>
      )}
    </Pressable>
  );
}

/** "No account yet? Sign up" under the form. */
export function AuthFooter({ text, link, onPress, disabled, children }) {
  const dir = useDir();
  return (
    <View style={[styles.footer, animate('loop-fade-in', '400ms', '260ms')]}>
      <View style={[styles.footerRow, dir.row]}>
        {!!text && <Text style={[styles.footerText, dir.light]}>{text}</Text>}
        {!!link && <TextLink title={link} onPress={onPress} disabled={disabled} />}
      </View>
      {children}
    </View>
  );
}

/** Label-free row of two things at the two ends (remember me ↔ forgot password). */
export function SplitRow({ children }) {
  const dir = useDir();
  return <View style={[styles.split, dir.row]}>{children}</View>;
}

/* ---------------------------------------------------------------- styles */

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  disabled: { opacity: 0.5, cursor: 'default' },

  // the card's own top bar (back, language) sits above this scroll (@desktop/DesktopAuthPanel AuthCardBar)
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 44, paddingTop: 12, paddingBottom: 40 },
  scrollWide: { justifyContent: 'flex-start', paddingHorizontal: 40 },
  body: { width: '100%', maxWidth: 460, alignSelf: 'center', gap: 22 },
  bodyWide: { maxWidth: 760 },

  header: { gap: 8 },
  headerIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    boxShadow: '0 0 34px rgba(255, 215, 0, 0.14)',
  },
  eyebrow: { color: palette.gold, fontSize: 12.5, letterSpacing: 0.4 },
  title: { color: onDark.text, fontSize: 28, lineHeight: 42, textShadow: '0 2px 18px rgba(0, 0, 0, 0.35)' },
  subtitle: { color: onDark.soft, fontSize: 13.5, lineHeight: 24 },

  switch: {
    padding: 4,
    gap: 4,
    borderRadius: radii.md + 2,
    backgroundColor: 'rgba(4, 15, 31, 0.35)',
    borderWidth: 1,
    borderColor: glass.hairline,
  },
  switchOption: {
    flex: 1,
    minWidth: 0,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radii.md - 2,
    cursor: 'pointer',
    transitionProperty: 'background-color, box-shadow',
    transitionDuration: motion.base,
  },
  switchHover: { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
  switchOn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
  },
  switchText: { color: onDark.muted, fontSize: 13.5 },
  switchTextOn: { color: onDark.text },

  fields: { gap: 18 },
  section: {
    borderRadius: radii.lg + 2,
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderWidth: 1,
    borderColor: glass.hairline,
  },
  sectionHead: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.22)',
  },
  sectionTitle: { color: onDark.text, fontSize: 15 },
  sectionSubtitle: { color: onDark.muted, fontSize: 12, marginTop: 1, lineHeight: 20 },
  sectionBody: { padding: 20, gap: 18 },

  grid: { flexWrap: 'wrap', columnGap: 16, rowGap: 18 },
  field: { gap: 8, width: '100%' },
  half: { width: 'calc(50% - 8px)', flexGrow: 1, minWidth: 220 },
  full: { width: '100%' },
  labelRow: { alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 20 },
  label: { color: 'rgba(240, 245, 252, 0.94)', fontSize: 13.5, flexShrink: 1 },
  required: { color: palette.gold },
  hint: { color: onDark.muted, fontSize: 11.5, lineHeight: 19 },
  errorRow: { alignItems: 'center', gap: 6 },
  errorText: { color: glass.danger, fontSize: 12, lineHeight: 19, flexShrink: 1 },

  box: {
    alignItems: 'center',
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: glass.field,
    borderWidth: 1,
    borderColor: glass.border,
    boxShadow: glass.inset,
    transitionProperty: 'border-color, box-shadow, background-color',
    transitionDuration: motion.fast,
  },
  boxMultiline: { alignItems: 'flex-start', paddingTop: 2 },
  boxHover: { borderColor: glass.borderHover, backgroundColor: glass.fieldHover },
  boxFocus: { borderColor: glass.focus, backgroundColor: glass.fieldFocus, boxShadow: glass.focusRing },
  boxInvalid: { borderColor: glass.dangerBorder, backgroundColor: 'rgba(255, 92, 92, 0.06)' },
  boxInvalidFocus: { boxShadow: glass.dangerRing },
  iconTop: { marginTop: 15 },
  inputWrap: { flex: 1, minWidth: 0, alignItems: 'center', direction: 'ltr' },
  input: {
    flex: 1,
    minWidth: 0,
    height: 52,
    fontSize: 15,
    color: onDark.text,
    backgroundColor: 'transparent',
    outlineStyle: 'none',
    borderWidth: 0,
  },
  ltrInput: { textAlign: 'left', writingDirection: 'ltr', letterSpacing: 0.3 },
  ltrEmptyRtl: { textAlign: 'right' },
  prefix: {
    writingDirection: 'ltr',
    color: palette.gold,
    fontSize: 14,
    paddingRight: 8,
    marginRight: 8,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.16)',
    lineHeight: 22,
  },
  trailingButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: motion.fast,
  },
  trailingButtonHover: { backgroundColor: 'rgba(255, 255, 255, 0.1)' },

  captchaRow: { gap: 10, alignItems: 'stretch' },
  captchaInput: { letterSpacing: 4, fontSize: 16 },
  captchaChip: {
    minWidth: 148,
    paddingLeft: 14,
    paddingRight: 36,
    height: 50,
    borderRadius: radii.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef3fb',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    cursor: 'pointer',
    transitionProperty: 'transform, box-shadow',
    transitionDuration: motion.fast,
  },
  captchaChipHover: { boxShadow: '0 6px 18px rgba(0, 0, 0, 0.3)' },
  captchaNoise: {
    ...StyleSheet.absoluteFillObject,
    backgroundImage: [
      'repeating-linear-gradient(115deg, rgba(0, 43, 84, 0.07) 0px, rgba(0, 43, 84, 0.07) 1px, transparent 1px, transparent 7px)',
      'linear-gradient(170deg, transparent 46%, rgba(0, 43, 84, 0.35) 47%, rgba(0, 43, 84, 0.35) 49%, transparent 50%)',
      'radial-gradient(60% 90% at 20% 30%, rgba(79, 143, 224, 0.18) 0%, transparent 70%)',
    ].join(', '),
  },
  captchaChars: { flexDirection: 'row', alignItems: 'center', gap: 3, direction: 'ltr' },
  captchaChar: { fontFamily: 'VazirBold', fontSize: 21, color: palette.navy800, letterSpacing: 1 },
  captchaRefresh: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 43, 84, 0.1)',
    transitionProperty: 'transform, background-color',
    transitionDuration: motion.base,
  },
  captchaRefreshHover: { transform: 'rotate(180deg)', backgroundColor: palette.gold },

  checkRow: {
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginHorizontal: -4,
    borderRadius: 10,
    cursor: 'pointer',
    flexShrink: 1,
  },
  checkRowHover: { backgroundColor: 'rgba(255, 255, 255, 0.04)' },
  checkbox: {
    width: 20,
    height: 20,
    marginTop: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    transitionProperty: 'background-color, border-color',
    transitionDuration: motion.fast,
  },
  checkboxOn: { backgroundColor: palette.gold, borderColor: palette.gold },
  checkboxInvalid: { borderColor: glass.danger },
  checkText: { flexShrink: 1, color: onDark.soft, fontSize: 13, lineHeight: 22 },
  inlineLink: { color: palette.gold, textDecorationLine: 'underline', cursor: 'pointer' },

  textLink: {
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginHorizontal: -6,
    borderRadius: 8,
    cursor: 'pointer',
    transitionProperty: 'background-color',
    transitionDuration: motion.fast,
  },
  textLinkHover: { backgroundColor: 'rgba(255, 215, 0, 0.1)' },
  textLinkText: { color: palette.gold, fontSize: 13 },
  textLinkMuted: { color: onDark.soft },

  choices: { gap: 10 },
  choice: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: radii.md,
    backgroundColor: glass.field,
    borderWidth: 1,
    borderColor: glass.border,
    cursor: 'pointer',
    transitionProperty: 'border-color, background-color, transform, box-shadow',
    transitionDuration: motion.base,
  },
  choiceHover: { borderColor: glass.borderHover, backgroundColor: glass.fieldHover, transform: 'translateY(-1px)' },
  choiceOn: {
    borderColor: glass.focus,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    boxShadow: '0 0 0 3px rgba(255, 215, 0, 0.12)',
  },
  choiceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  choiceIconOn: { backgroundImage: gradients.gold },
  choiceText: { color: onDark.soft, fontSize: 13, textAlign: 'center', lineHeight: 21 },
  choiceTextOn: { color: onDark.text },
  choiceTick: {
    position: 'absolute',
    top: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.gold,
  },
  choiceTickRtl: { left: 8 },
  choiceTickLtr: { right: 8 },

  pickerPress: { cursor: 'pointer' },
  pickerText: { lineHeight: 48 },
  pickerPlaceholder: { color: glass.placeholder },

  avatarRow: { alignItems: 'center', gap: 16 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 215, 0, 0.45)',
    cursor: 'pointer',
    transitionProperty: 'border-color, background-color',
    transitionDuration: motion.fast,
  },
  avatarHover: { borderColor: palette.gold, backgroundColor: 'rgba(255, 215, 0, 0.08)' },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: gradients.gold,
    borderWidth: 2,
    borderColor: palette.navy850,
  },
  avatarTitle: { color: onDark.text, fontSize: 14 },

  otp: { flexDirection: 'row', direction: 'ltr', justifyContent: 'center', gap: 10, cursor: 'text' },
  otpCell: {
    width: 54,
    height: 62,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: glass.field,
    borderWidth: 1,
    borderColor: glass.border,
    transitionProperty: 'border-color, box-shadow, background-color, transform',
    transitionDuration: motion.fast,
  },
  otpCellFilled: { backgroundColor: 'rgba(255, 255, 255, 0.11)', borderColor: 'rgba(255, 255, 255, 0.32)' },
  otpCellActive: { borderColor: glass.focus, boxShadow: glass.focusRing, transform: 'translateY(-2px)' },
  otpCellInvalid: { borderColor: glass.dangerBorder },
  otpDigit: { color: onDark.text, fontSize: 24, fontFamily: 'VazirBold' },
  otpCaret: { position: 'absolute', width: 2, height: 26, borderRadius: 1, backgroundColor: palette.gold, animationKeyframes: { '0%': { opacity: 1 }, '50%': { opacity: 0 }, '100%': { opacity: 1 } }, animationDuration: '1s', animationIterationCount: 'infinite' },
  otpHidden: { position: 'absolute', opacity: 0, width: 1, height: 1, left: 0, top: 0 },

  alert: { alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: radii.md, borderWidth: 1 },
  alertIcon: { marginTop: 2 },
  alertTitle: { fontSize: 13.5, lineHeight: 22 },
  alertText: { color: onDark.soft, fontSize: 12.5, lineHeight: 22 },

  submit: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    cursor: 'pointer',
    userSelect: 'none',
    transitionProperty: 'transform, box-shadow, filter, background-color',
    transitionDuration: motion.fast,
  },
  submitGold: {
    // a soft sheen across the gold, which slides over on hover
    backgroundImage: `linear-gradient(110deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.45) 45%, rgba(255,255,255,0) 60%), ${gradients.gold}`,
    backgroundSize: '250% 100%, 100% 100%',
    backgroundPosition: '120% 0, 0 0',
    backgroundRepeat: 'no-repeat',
    borderColor: 'rgba(255, 228, 92, 0.9)',
    boxShadow: '0 12px 30px rgba(233, 179, 8, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.45)',
    transitionProperty: 'transform, box-shadow, filter, background-position',
    transitionDuration: '600ms',
  },
  submitGoldHover: {
    transform: 'translateY(-1px)',
    filter: 'brightness(1.04)',
    backgroundPosition: '-20% 0, 0 0',
    boxShadow: '0 16px 38px rgba(233, 179, 8, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
  },
  submitGlass: { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: glass.border },
  submitGlassHover: { backgroundColor: 'rgba(255, 255, 255, 0.13)', borderColor: glass.borderHover },
  submitPressed: { transform: 'scale(0.985)' },
  submitText: { color: palette.navy900, fontSize: 15.5 },
  submitTextGlass: { color: onDark.text },

  footer: { gap: 14, paddingTop: 20, borderTopWidth: 1, borderTopColor: glass.hairline, alignItems: 'center' },
  footerRow: { alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  footerText: { color: onDark.muted, fontSize: 13 },

  resend: { alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 30 },
  resendClock: { color: palette.gold, fontFamily: 'VazirBold', fontSize: 14, letterSpacing: 1, direction: 'ltr' },

  split: { alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: -4 },
});
