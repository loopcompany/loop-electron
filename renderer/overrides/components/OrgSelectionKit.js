/**
 * DESKTOP OVERRIDE of loop-customer-mobile/components/OrgSelectionKit.js
 *
 * The building blocks of the two organisation order flows (systematic and
 * comprehensive). Same exports and props as the mobile kit. The accordion
 * pieces (AccordionHeader, StepBadge, SectionBody, RadioList) are the mobile
 * file verbatim — the desktop flows lay their steps out with
 * @desktop/WizardLayout instead. Everything a user sees inside a step is
 * redrawn for a desktop: option cards with a check mark and hover, pill
 * counters, device cards that light up when counted, inputs with a focus
 * ring, section sub-headings, a summary card and the order actions as a
 * row of buttons.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import HintBadge from './HintBadge';
import { showToastOrAlert, langIsRTL } from '@helpers/Common';
import { themeColor0, themeColor1, themeColor3, themeColor4, themeColor10, colors } from '@theme/Color';
import { spacing } from '@theme/Spacing';
import { radius } from '@theme/Radius';
import { fontSize, getFontFamily } from '@theme/Typography';
import { shadow } from '@theme/Shadows';
import { L } from '@org/orgI18n';
import i18n from 'i18next';

import { elevation, gradients, motion, palette, radii, surface } from '@desktop/desktopTheme';
import { DButton, formatNumber } from '@desktop/ui';

const rtl = () => langIsRTL(i18n.language);
const dirRow = () => ({ flexDirection: rtl() ? 'row-reverse' : 'row' });
const align = () => ({ textAlign: rtl() ? 'right' : 'left', writingDirection: rtl() ? 'rtl' : 'ltr' });
const bold = () => ({ fontFamily: getFontFamily('bold', i18n.language) });
const light = () => ({ fontFamily: getFontFamily('light', i18n.language) });
const num = (n) => formatNumber(n, i18n.language);

// سربرگ آکاردئونی هر بخش. با پاس‌دادن step، شماره‌ی مرحله در سمت راست عنوان
// نمایش داده می‌شود (حالت stepper در «انتخاب سیستماتیک»).
// innerRef به بیرون داده می‌شود تا صفحه بتواند موقعیت سربرگ را اندازه بگیرد و بعد
// از باز شدن بخش، خودکار روی همان سربرگ اسکرول کند (hooks/useAccordionScroll.js).
const STEP_ICON_COLUMN = 44;
const STEP_BADGE_COLUMN = 30;

const accordionTitleStyle = {
  color: themeColor4.bgColor(1),
  fontSize: fontSize.md,
  fontWeight: 'bold',
  fontFamily: 'VazirBold',
  textAlign: 'center',
};

export const AccordionHeader = ({ title, hint, icon, expanded, onPress, step, done, innerRef }) => (
  <View
    ref={innerRef}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
      marginTop: 6,
    }}
  >
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: '100%',
        backgroundColor: themeColor0.bgColor(1),
        borderRadius: radius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View style={{ width: 26, alignItems: 'flex-start' }}>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={themeColor1.bgColor(1)}
        />
      </View>
      {step ? (
        // حالت stepper: آیکون و شماره‌ی مرحله هر کدام ستون با عرض ثابت دارند و
        // عنوان بین آن‌ها جا می‌گیرد. قبلاً هر سه با هم وسط‌چین می‌شدند و با
        // عوض‌شدن طول عنوان، شماره‌های زرد و آیکون‌ها در سطرهای مختلف جابه‌جا
        // می‌افتادند (در یک ستون عمودی نبودند).
        <>
          <View style={{ width: STEP_ICON_COLUMN, alignItems: 'center' }}>
            {icon ? <Image source={icon} style={{ width: 36, height: 36 }} resizeMode="contain" /> : null}
          </View>
          <Text style={[accordionTitleStyle, { flex: 1, marginHorizontal: spacing.xs }]}>
            {title}
          </Text>
          <View style={{ width: STEP_BADGE_COLUMN, alignItems: 'center' }}>
            <StepBadge step={step} done={done} />
          </View>
        </>
      ) : (
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          {icon ? <Image source={icon} style={{ width: 36, height: 36, marginHorizontal: spacing.xs }} resizeMode="contain" /> : null}
          <Text style={accordionTitleStyle}>{title}</Text>
        </View>
      )}
      <View style={{ width: 26, alignItems: 'flex-end' }}>
        <HintBadge hint={hint} title={title} size={22} />
      </View>
    </TouchableOpacity>
  </View>
);

// شماره‌ی مرحله کنار عنوان - وقتی مرحله تکمیل شده باشد تیک سبز نشان می‌دهد.
export const StepBadge = ({ step, done }) => (
  <View
    style={{
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: done ? colors.success.bgColor(1) : colors.accent.bgColor(1),
    }}
  >
    {done ? (
      <Ionicons name="checkmark" size={13} color={themeColor4.bgColor(1)} />
    ) : (
      <Text style={{ fontFamily: 'VazirBold', fontSize: 11, color: themeColor0.color }}>{step}</Text>
    )}
  </View>
);

export const SectionBody = ({ children }) => (
  <BlurView
    intensity={40}
    tint="light"
    style={{
      backgroundColor: colors.surface.bgColor(0.35),
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      overflow: 'hidden',
    }}
  >
    {children}
  </BlurView>
);

export const RadioList = ({ options, value, onChange }) => (
  <View>
    {options.map((opt) => {
      const selected = value === opt.id;
      return (
        <TouchableOpacity
          key={opt.id}
          onPress={() => onChange(opt.id)}
          style={{
            flexDirection: rtl() ? 'row-reverse' : 'row',
            alignItems: 'center',
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: themeColor10.bgColor(0.08),
          }}
        >
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: themeColor0.bgColor(1),
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 10,
            }}
          >
            {selected && (
              <View
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 6,
                  backgroundColor: themeColor0.bgColor(1),
                }}
              />
            )}
          </View>
          <Text style={{ fontFamily: 'VazirLight', fontSize: 14, color: themeColor10.bgColor(1) }}>
            {opt.title}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// گزینه‌های قابل انتخاب: کارت با تیک، تک یا چندانتخابی، با حالت قفل.
export const SelectableOptions = ({ options, value, onChange, multi = false, columns = 2, disabled = false }) => {
  const isSelected = (id) => (multi ? Array.isArray(value) && value.includes(id) : value === id);

  const handlePress = (id) => {
    if (multi) {
      const current = Array.isArray(value) ? value : [];
      onChange(current.includes(id) ? current.filter((v) => v !== id) : [...current, id]);
    } else {
      onChange(value === id ? null : id);
    }
  };

  const gap = 10;
  const itemWidth = columns === 1 ? '100%' : `calc(${100 / columns}% - ${(gap * (columns - 1)) / columns}px)`;

  return (
    <View style={[k.optionGrid, dirRow(), { gap }]}>
      {options.map((opt) => {
        const selected = isSelected(opt.id);
        const locked = disabled || opt.disabled;
        return (
          <Pressable
            key={opt.id}
            onPress={() => handlePress(opt.id)}
            disabled={locked}
            accessibilityRole={multi ? 'checkbox' : 'radio'}
            accessibilityState={{ disabled: Boolean(locked), checked: Boolean(selected) }}
            style={({ hovered, pressed }) => [
              k.option,
              dirRow(),
              { width: itemWidth },
              hovered && !locked && !selected && k.optionHover,
              pressed && !locked && k.optionPressed,
              selected && k.optionSelected,
              locked && k.optionLocked,
            ]}
          >
            <View style={[multi ? k.checkbox : k.radio, selected && k.markOn, locked && k.markLocked]}>
              {locked ? (
                <Ionicons name="lock-closed" size={10} color={surface.faint} />
              ) : selected ? (
                multi ? <Ionicons name="checkmark" size={13} color={palette.white} /> : <View style={k.radioDot} />
              ) : null}
            </View>
            <Text
              style={[k.optionText, selected ? bold() : light(), align(), selected && k.optionTextSelected, locked && k.optionTextLocked]}
              numberOfLines={2}
            >
              {opt.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const CounterButton = ({ icon, onPress, disabled, primary, size }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    style={({ hovered, pressed }) => [
      k.counterBtn,
      { width: size, height: size, borderRadius: size / 2 },
      primary ? k.counterBtnPrimary : k.counterBtnSoft,
      hovered && !disabled && (primary ? k.counterBtnPrimaryHover : k.counterBtnSoftHover),
      pressed && !disabled && k.counterBtnPressed,
      disabled && k.counterBtnDisabled,
    ]}
  >
    <Ionicons name={icon} size={Math.round(size * 0.56)} color={primary ? palette.white : disabled ? surface.faint : surface.brandText} />
  </Pressable>
);

export const CounterRow = ({ title, count, onIncrement, onDecrement }) => (
  <View style={[k.counterRow, dirRow()]}>
    <Text style={[k.counterRowTitle, bold(), align()]}>{title}</Text>
    <MiniCounter count={count} onIncrement={onIncrement} onDecrement={onDecrement} size="md" />
  </View>
);

// شمارشگر کپسولی (− عدد +) — دکمه‌ی کم‌کردن در صفر خاموش است.
export const MiniCounter = ({ count, onIncrement, onDecrement, size = 'sm' }) => {
  const btn = size === 'md' ? 30 : 26;
  const active = count > 0;
  return (
    <View style={[k.counter, active && k.counterActive]}>
      <CounterButton icon="remove" onPress={onDecrement} disabled={!active} size={btn} />
      <Text style={[k.counterValue, bold(), { minWidth: size === 'md' ? 34 : 28 }, active && k.counterValueActive]}>
        {num(count)}
      </Text>
      <CounterButton icon="add" onPress={onIncrement} primary size={btn} />
    </View>
  );
};

// عنوان زیربخش: خط و آیکون، به‌جای نوار سرمه‌ای موبایل.
export const SubSectionBanner = ({ title, style }) => (
  <View style={[k.subHeading, dirRow(), style]}>
    <View style={k.subHeadingMark} />
    <Text style={[k.subHeadingText, bold(), align()]}>{title}</Text>
    <View style={k.subHeadingLine} />
  </View>
);

export const HardwareIconBox = ({ image, size = 60, active = false, style }) => (
  <View
    style={[
      k.iconBox,
      { width: size, height: size, borderRadius: Math.round(size * 0.28) },
      active && k.iconBoxActive,
      style,
    ]}
  >
    <Image source={image} style={{ width: size * 0.78, height: size * 0.78 }} resizeMode="contain" />
  </View>
);

const CountBadge = ({ count }) => (
  <View style={[k.badge, rtl() ? { left: -7 } : { right: -7 }]}>
    <Text style={[k.badgeText, bold()]}>{num(count)}</Text>
  </View>
);

export const DeviceCountRow = ({ title, subtitle, image, count, onIncrement, onDecrement }) => {
  const active = count > 0;
  return (
    <View style={[k.card, k.deviceRow, dirRow(), active && k.cardActive]}>
      <View>
        <HardwareIconBox image={image} size={58} active={active} />
        {active ? <CountBadge count={count} /> : null}
      </View>
      <View style={k.flex}>
        <Text style={[k.cardTitle, bold(), align()]} numberOfLines={2}>{title}</Text>
        <Text style={[k.cardSubtitle, light(), align()]} numberOfLines={1}>{subtitle || L('تعداد مورد نیاز')}</Text>
      </View>
      <MiniCounter count={count} onIncrement={onIncrement} onDecrement={onDecrement} size="md" />
    </View>
  );
};

export const DeviceCountTile = ({ title, image, count, onIncrement, onDecrement, width = '31%' }) => {
  const active = count > 0;
  return (
    <View style={[k.card, k.tile, { width }, active && k.cardActive]}>
      <View>
        <Image source={image} style={k.tileImage} resizeMode="contain" />
        {active ? <CountBadge count={count} /> : null}
      </View>
      <Text style={[k.tileTitle, bold(), active && k.tileTitleActive]} numberOfLines={1}>{title}</Text>
      <MiniCounter count={count} onIncrement={onIncrement} onDecrement={onDecrement} />
    </View>
  );
};

export const DescriptionInput = ({ value, onChangeText, placeholder = L('توضیحات (اختیاری)'), style }) => {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={surface.faint}
      multiline
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[k.input, light(), align(), focused && k.inputFocused, style]}
    />
  );
};

export const PhotoNoteInput = ({
  photos = [],
  note = '',
  onChangePhotos,
  onChangeNote,
  notePlaceholder = L('توضیحات دیگری دارید بنویسید...'),
}) => {
  const addPhotos = async (fromCamera) => {
    try {
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showToastOrAlert(L('برای گرفتن عکس، دسترسی به دوربین لازم است'));
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showToastOrAlert(L('برای انتخاب عکس، دسترسی به گالری لازم است'));
          return;
        }
      }

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            quality: 0.7,
            allowsMultipleSelection: true,
          });

      if (!result.canceled && result.assets?.length) {
        onChangePhotos([...photos, ...result.assets.map((asset) => asset.uri)]);
      }
    } catch (error) {
      console.warn('PhotoNoteInput image error:', error);
      showToastOrAlert(L('خطا در انتخاب عکس'));
    }
  };

  const removePhoto = (uri) => onChangePhotos(photos.filter((item) => item !== uri));

  return (
    <View style={k.photoBlock}>
      <View style={[k.uploadRow, dirRow()]}>
        {[
          { icon: 'cloud-upload-outline', label: L('بارگزاری عکس مرتبط با سفارش'), camera: false },
          { icon: 'camera-outline', label: L('عکس از گالری و دوربین'), camera: true },
        ].map((action) => (
          <Pressable
            key={action.icon}
            onPress={() => addPhotos(action.camera)}
            accessibilityRole="button"
            style={({ hovered }) => [k.upload, hovered && k.uploadHover]}
          >
            <View style={k.uploadIcon}>
              <Ionicons name={action.icon} size={22} color={palette.brandBright} />
            </View>
            <Text style={[k.uploadText, bold()]}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      {photos.length ? (
        <View style={[k.thumbs, dirRow()]}>
          {photos.map((uri) => (
            <View key={uri}>
              <Image source={{ uri }} style={k.thumb} />
              <Pressable onPress={() => removePhoto(uri)} accessibilityRole="button" style={[k.thumbRemove, rtl() ? { left: -6 } : { right: -6 }]}>
                <Ionicons name="close" size={12} color={palette.white} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <DescriptionInput value={note} onChangeText={onChangeNote} placeholder={notePlaceholder} />
    </View>
  );
};

export const HardwareCard = ({ image, title, count, desc, onIncrement, onDecrement, onDescChange }) => {
  const active = count > 0;
  return (
    <View style={[k.card, k.bigCard, active && k.cardActive]}>
      <View style={[k.bigCardTop, dirRow()]}>
        <View>
          <HardwareIconBox image={image} size={58} active={active} />
          {active ? <CountBadge count={count} /> : null}
        </View>
        <Text style={[k.cardTitle, k.flex, bold(), align()]} numberOfLines={2}>{title}</Text>
        <MiniCounter count={count} onIncrement={onIncrement} onDecrement={onDecrement} size="md" />
      </View>
      <DescriptionInput value={desc} onChangeText={onDescChange} />
    </View>
  );
};

export const LabeledCounterRow = ({ label, count, onIncrement, onDecrement }) => (
  <View style={[k.labeled, dirRow()]}>
    <Text style={[k.labeledText, light(), align()]} numberOfLines={1}>{label}</Text>
    <MiniCounter count={count} onIncrement={onIncrement} onDecrement={onDecrement} />
  </View>
);

export const ProcurementCard = ({ image, title, newCount, usedCount, desc, onNewInc, onNewDec, onUsedInc, onUsedDec, onDescChange }) => {
  const active = newCount > 0 || usedCount > 0;
  return (
    <View style={[k.card, k.bigCard, active && k.cardActive]}>
      <View style={[k.bigCardTop, dirRow()]}>
        <View>
          <HardwareIconBox image={image} size={58} active={active} />
          {active ? <CountBadge count={newCount + usedCount} /> : null}
        </View>
        <Text style={[k.cardTitle, k.flex, bold(), align()]} numberOfLines={2}>{title}</Text>
      </View>
      <View style={[k.procurementCounters, dirRow()]}>
        <LabeledCounterRow label={L('آکبند')} count={newCount} onIncrement={onNewInc} onDecrement={onNewDec} />
        <LabeledCounterRow label={L('کارکرده')} count={usedCount} onIncrement={onUsedInc} onDecrement={onUsedDec} />
      </View>
      <DescriptionInput value={desc} onChangeText={onDescChange} />
    </View>
  );
};

export const CounterWithDescription = ({ title, count, desc, onIncrement, onDecrement, onDescChange }) => (
  <View style={[k.card, k.bigCard, count > 0 && k.cardActive]}>
    <CounterRow title={title} count={count} onIncrement={onIncrement} onDecrement={onDecrement} />
    <DescriptionInput value={desc} onChangeText={onDescChange} />
  </View>
);

export const SummaryBox = ({ title, lines }) => {
  if (!lines.length) return null;
  return (
    <View style={k.summary}>
      <View style={[k.summaryHead, dirRow()]}>
        <Ionicons name="document-text-outline" size={18} color={palette.gold} />
        <Text style={[k.summaryTitle, bold(), align()]}>{title}</Text>
      </View>
      <View style={[k.summaryGrid, dirRow()]}>
        {lines.map((line, idx) => (
          <View key={idx} style={[k.summaryLine, dirRow()]}>
            <Text style={[k.summaryLabel, light(), align()]} numberOfLines={2}>{line.label}</Text>
            <Text style={[k.summaryValue, bold()]} numberOfLines={2}>
              {typeof line.value === 'number' ? num(line.value) : line.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export const BrandGrid = ({ brands, value, onChange, columns = 3 }) => {
  const gap = 12;
  const width = `calc(${100 / columns}% - ${(gap * (columns - 1)) / columns}px)`;
  return (
    <View style={[k.optionGrid, dirRow(), { gap }]}>
      {brands.map((brand) => {
        const selected = value === brand.id;
        return (
          <Pressable
            key={brand.id}
            onPress={() => onChange(selected ? null : brand.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            style={({ hovered }) => [k.brand, { width }, hovered && !selected && k.brandHover, selected && k.brandSelected]}
          >
            <View style={[k.brandLogo, selected && k.brandLogoSelected]}>
              {brand.image ? (
                <Image source={brand.image} style={k.brandImage} resizeMode="contain" />
              ) : (
                <Text style={[k.brandName, bold()]} numberOfLines={2}>{brand.title}</Text>
              )}
            </View>
            <Text style={[k.brandLabel, selected ? bold() : light(), selected && k.brandLabelSelected]} numberOfLines={1}>
              {brand.title}
            </Text>
            {selected ? (
              <View style={[k.brandCheck, rtl() ? { left: 8 } : { right: 8 }]}>
                <Ionicons name="checkmark" size={12} color={palette.white} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
};

export const IconOptionGrid = ({ options, value, onChange, columns = 3, imageSize = 72 }) => {
  const gap = 12;
  const width = `calc(${100 / columns}% - ${(gap * (columns - 1)) / columns}px)`;
  return (
    <View style={[k.optionGrid, dirRow(), { gap }]}>
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(selected ? null : opt.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            style={({ hovered }) => [k.brand, { width }, hovered && !selected && k.brandHover, selected && k.brandSelected]}
          >
            <Image source={opt.image} style={{ width: imageSize, height: imageSize }} resizeMode="contain" />
            <Text style={[k.brandLabel, selected ? bold() : light(), selected && k.brandLabelSelected]} numberOfLines={1}>
              {opt.title}
            </Text>
            {selected ? (
              <View style={[k.brandCheck, rtl() ? { left: 8 } : { right: 8 }]}>
                <Ionicons name="checkmark" size={12} color={palette.white} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
};

// چهار عمل پایانی سفارش: یک ردیف دکمه، با «ثبت سفارش» به‌عنوان عمل اصلی.
export const OrderActionButtons = ({ onIssueReceipt, onShowReceipt, onSubmit, onCancel }) => (
  <View style={k.actions}>
    <View style={[k.actionsRow, dirRow()]}>
      <DButton title={L('ثبت سفارش')} icon="checkmark-done" variant="gold" size="lg" onPress={onSubmit} />
      <DButton title={L('صدور پیش‌رسید')} icon="document-text-outline" size="lg" onPress={onIssueReceipt} />
      <DButton title={L('نمایش پیش‌رسید')} icon="eye-outline" variant="outline" size="lg" onPress={onShowReceipt} />
      <View style={k.flex} />
      <DButton title={L('لغو سفارش')} icon="close-circle-outline" variant="danger" size="lg" onPress={onCancel} />
    </View>
  </View>
);

export const ActionButton = ({ title, color, onPress, last }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    style={({ hovered }) => [
      k.legacyAction,
      { backgroundColor: color.bgColor(1), marginBottom: last ? 0 : 8 },
      hovered && k.legacyActionHover,
    ]}
  >
    <Text style={[k.legacyActionText, bold()]}>{title}</Text>
  </Pressable>
);

const k = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },

  optionGrid: { flexWrap: 'wrap', marginBottom: 6 },
  option: {
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
  optionHover: { borderColor: 'rgba(29, 95, 174, 0.45)', backgroundColor: surface.cardMuted },
  optionPressed: { transform: 'scale(0.99)' },
  optionSelected: {
    borderColor: palette.brandBright,
    backgroundColor: 'rgba(29, 95, 174, 0.06)',
    boxShadow: '0 0 0 3px rgba(79, 143, 224, 0.18)',
  },
  optionLocked: { backgroundColor: surface.sunken, borderColor: surface.border, cursor: 'default', opacity: 0.7 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: surface.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: surface.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markOn: { borderColor: palette.brandBright, backgroundColor: palette.brandBright },
  markLocked: { borderColor: surface.border, backgroundColor: 'transparent' },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: surface.card },
  optionText: { flex: 1, fontSize: 13.5, lineHeight: 22, color: surface.title },
  optionTextSelected: { color: surface.brandText },
  optionTextLocked: { color: surface.faint },

  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderRadius: radii.pill,
    backgroundColor: surface.sunken,
    borderWidth: 1,
    borderColor: surface.border,
  },
  counterActive: { backgroundColor: 'rgba(29, 95, 174, 0.06)', borderColor: 'rgba(29, 95, 174, 0.3)' },
  counterBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transitionProperty: 'transform, filter, background-color',
    transitionDuration: motion.fast,
  },
  counterBtnPrimary: { backgroundImage: gradients.brand, boxShadow: '0 3px 8px rgba(0, 43, 84, 0.25)' },
  counterBtnPrimaryHover: { filter: 'brightness(1.12)' },
  counterBtnSoft: { backgroundColor: surface.card },
  counterBtnSoftHover: { backgroundColor: 'rgba(0, 43, 84, 0.07)' },
  counterBtnPressed: { transform: 'scale(0.92)' },
  counterBtnDisabled: { opacity: 0.45, cursor: 'default' },
  counterValue: { textAlign: 'center', fontSize: 14, color: surface.faint },
  counterValueActive: { color: surface.brandText },
  counterRow: { alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 6 },
  counterRowTitle: { flex: 1, fontSize: 14, color: surface.title },

  subHeading: { alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 14 },
  subHeadingMark: { width: 4, height: 18, borderRadius: 2, backgroundImage: gradients.gold },
  subHeadingText: { fontSize: 14.5, color: surface.brandText },
  subHeadingLine: { flex: 1, height: 1, backgroundColor: surface.border },

  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: surface.cardMuted,
    borderWidth: 1,
    borderColor: surface.border,
    transitionProperty: 'border-color, background-color',
    transitionDuration: motion.base,
  },
  iconBoxActive: { backgroundColor: 'rgba(255, 215, 0, 0.12)', borderColor: 'rgba(233, 179, 8, 0.55)' },
  badge: {
    position: 'absolute',
    top: -7,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: gradients.gold,
    borderWidth: 2,
    borderColor: surface.card,
    boxShadow: elevation.gold,
  },
  badgeText: { fontSize: 11, color: palette.navy900 },

  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: surface.border,
    backgroundColor: surface.card,
    boxShadow: elevation.card,
    transitionProperty: 'border-color, box-shadow, background-color',
    transitionDuration: motion.base,
  },
  cardActive: { borderColor: 'rgba(29, 95, 174, 0.4)', boxShadow: '0 0 0 3px rgba(79, 143, 224, 0.12), 0 6px 18px rgba(10, 30, 60, 0.06)' },
  deviceRow: { alignItems: 'center', gap: 14, padding: 12, marginBottom: 0 },
  cardTitle: { fontSize: 14, color: surface.title },
  cardSubtitle: { fontSize: 11.5, color: surface.faint, marginTop: 2 },
  tile: { alignItems: 'center', gap: 10, paddingVertical: 16, paddingHorizontal: 8 },
  tileImage: { width: 60, height: 60 },
  tileTitle: { fontSize: 12.5, color: surface.title, textAlign: 'center' },
  tileTitleActive: { color: surface.brandText },
  bigCard: { padding: 14, gap: 10 },
  bigCardTop: { alignItems: 'center', gap: 14 },
  procurementCounters: { gap: 10 },
  labeled: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: surface.cardMuted,
    borderWidth: 1,
    borderColor: surface.border,
  },
  labeledText: { fontSize: 12.5, color: surface.muted },

  input: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 4,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: surface.borderStrong,
    backgroundColor: surface.card,
    fontSize: 13.5,
    lineHeight: 22,
    color: surface.title,
    outlineStyle: 'none',
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: motion.fast,
  },
  inputFocused: { borderColor: palette.sky, boxShadow: elevation.focus },

  photoBlock: { gap: 10, marginTop: 8 },
  uploadRow: { gap: 10 },
  upload: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
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
  uploadIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: surface.card,
    boxShadow: elevation.card,
  },
  uploadText: { fontSize: 13, color: surface.title },
  thumbs: { flexWrap: 'wrap', gap: 10 },
  thumb: { width: 72, height: 72, borderRadius: radii.md },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.danger,
    borderWidth: 2,
    borderColor: surface.card,
    cursor: 'pointer',
  },

  summary: {
    marginTop: 16,
    padding: 18,
    gap: 12,
    borderRadius: radii.lg,
    backgroundImage: gradients.hero,
    boxShadow: elevation.raised,
  },
  summaryHead: { alignItems: 'center', gap: 8 },
  summaryTitle: { flex: 1, fontSize: 14.5, color: palette.white },
  summaryGrid: { flexWrap: 'wrap', columnGap: 18 },
  summaryLine: {
    width: 'calc(50% - 9px)',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  summaryLabel: { flex: 1, fontSize: 12.5, color: 'rgba(226, 234, 247, 0.78)' },
  summaryValue: { fontSize: 13, color: palette.gold },

  brand: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: surface.border,
    backgroundColor: surface.card,
    cursor: 'pointer',
    transitionProperty: 'border-color, box-shadow, transform, background-color',
    transitionDuration: motion.base,
  },
  brandHover: { transform: 'translateY(-2px)', boxShadow: elevation.raised, borderColor: 'rgba(29, 95, 174, 0.3)' },
  brandSelected: {
    borderColor: palette.brandBright,
    backgroundColor: 'rgba(29, 95, 174, 0.05)',
    boxShadow: '0 0 0 3px rgba(79, 143, 224, 0.2)',
  },
  brandLogo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: surface.card,
    borderWidth: 1.5,
    borderColor: 'rgba(233, 179, 8, 0.55)',
  },
  brandLogoSelected: { borderColor: palette.brandBright },
  brandImage: { width: 50, height: 50 },
  brandName: { fontSize: 11.5, color: surface.title, textAlign: 'center', paddingHorizontal: 4 },
  brandLabel: { fontSize: 12, color: surface.muted, textAlign: 'center' },
  brandLabelSelected: { color: surface.brandText },
  brandCheck: {
    position: 'absolute',
    top: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.brandBright,
  },

  actions: { marginTop: 4 },
  actionsRow: { alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  legacyAction: {
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
    cursor: 'pointer',
    transitionProperty: 'filter',
    transitionDuration: motion.fast,
  },
  legacyActionHover: { filter: 'brightness(1.08)' },
  legacyActionText: { color: palette.white },
});
