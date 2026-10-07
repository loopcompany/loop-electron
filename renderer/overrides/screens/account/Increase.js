/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/account/Increase.js
 *
 * Topping up the wallet as a desktop checkout (@desktop/FormKit): one large
 * amount field, quick amounts, the balance before and after, the limits,
 * and the pay button saying exactly what will be charged.
 *
 * Same logic as the mobile file, copied verbatim: the preset amount from
 * the route, the server balance, the min/max checks and messages,
 * `chargeWallet` and the in-app gateway with its result handling.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import { Platform, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

import { formatPrice, showToastOrAlert } from '@helpers/Common';
import { fetchUser } from '@slices/userSlice';
import { chargeWallet, MIN_CHARGE_AMOUNT, MAX_CHARGE_AMOUNT } from '@services/WalletApi';
import { fetchWalletBalance, seedBalance, selectWalletBalance } from '@slices/walletSlice';
import ScreenHeaders from '@components/ScreenHeaders';
import { createPaymentRedirectUrl, openPaymentGateway } from '@utils/paymentGateway';

import { DButton, formatNumber, useDir } from '@desktop/ui';
import { FormPage, FormSection, TipsCard } from '@desktop/FormKit';
import { elevation, gradients, motion, onDark, palette, radii, surface } from '@desktop/desktopTheme';

const QUICK = [500000, 1000000, 2000000, 5000000, 10000000];

export default function Increase({ navigation, route }) {
  const { t, i18n } = useTranslation();
  const dir = useDir();
  const fa = i18n.language === 'fa';
  const dispatch = useDispatch();
  const token = useSelector((state) => state?.auth?.token);
  const user = useSelector((state) => state.user?.data);
  // موجودی از walletSlice می‌آید، نه از snapshot پروفایل — بعد از هر شارژ
  // موفق تازه می‌شود. تا رسیدن اولین پاسخ، مقدار پروفایل نمایش داده می‌شود.
  const walletBalance = useSelector(selectWalletBalance);
  const [loading, setLoading] = useState(false);
  const presetAmount = Number(route?.params?.amount);
  const [amount, setAmount] = useState(
    presetAmount >= MIN_CHARGE_AMOUNT && presetAmount <= MAX_CHARGE_AMOUNT ? presetAmount : null
  );
  const paymentSessionRef = useRef(null);

  const redirectUrl = createPaymentRedirectUrl();

  useEffect(() => {
    dispatch(seedBalance(user?.wallet));
    if (token) dispatch(fetchWalletBalance(token));
    // `user?.wallet` عمداً در وابستگی‌ها نیست: فقط مقدار اولیه است و
    // تغییرش نباید یک درخواست دیگر بفرستد.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, token]);

  // بستن نشستِ پرداخت هنگام unmount تا شنونده‌ی لینک باقی نماند.
  useEffect(() => {
    return () => {
      paymentSessionRef.current?.close();
      paymentSessionRef.current = null;
    };
  }, []);

  // بازگشت از درگاه. `null` یعنی کاربر بدون نتیجه برگشت و فقط باید دکمه آزاد شود.
  const handlePaymentResult = (status) => {
    if (status === 'OK') {
      // موجودی را سرور بعد از تأیید callback بالا می‌برد؛ ما فقط
      // دوباره می‌خوانیمش و هرگز محلی اضافه نمی‌کنیم.
      dispatch(fetchUser(token));
      dispatch(fetchWalletBalance(token));
      showToastOrAlert(t('Your wallet has been successfully topped up.'));
      setLoading(false);
      if (Platform.OS == 'web') {
        window.history.back();
      } else {
        navigation.goBack();
      }
      return;
    }

    if (status === 'NOK') showToastOrAlert(t('Transaction failed'));
    setLoading(false);
  };

  const increaseWallet = async () => {
    // همان محدوده‌ای که بک‌اند اعتبارسنجی می‌کند — از WalletApi می‌آید تا
    // اگر تغییر کرد، در یک جا عوض شود.
    const value = Number(amount);

    if (!value || value < MIN_CHARGE_AMOUNT) {
      showToastOrAlert(t('The minimum amount for wallet recharge is 10,000 Tomans'));
      return;
    }

    if (value > MAX_CHARGE_AMOUNT) {
      showToastOrAlert(t('The maximum amount for wallet recharge is 50,000,000 Tomans'));
      return;
    }

    setLoading(true);

    const result = await chargeWallet(token, { amount: value, linking_url: redirectUrl });
    const paymentUrl = result.data?.payment_url;

    // یک 2xx بدون payment_url موفقیت نیست؛ قبلاً این حالت کاربر را بدون
    // هیچ بازخوردی رها می‌کرد.
    if (!result.ok || !paymentUrl) {
      showToastOrAlert(result.message || t('Error connecting to payment gateway'));
      setLoading(false);
      return;
    }

    // مرورگر درون‌برنامه‌ای: اپ در پس‌زمینه زنده می‌ماند و بعد از پرداخت
    // همان صفحه ادامه پیدا می‌کند، به‌جای اینکه از اسپلش شروع شود.
    paymentSessionRef.current = openPaymentGateway({
      paymentUrl,
      redirectUrl,
      onResult: handlePaymentResult,
    });

    if (!(await paymentSessionRef.current.opened)) {
      showToastOrAlert(t('Error connecting to payment gateway'));
      setLoading(false);
    }
  };
  const value = Number(amount) || 0;
  const valid = value >= MIN_CHARGE_AMOUNT && value <= MAX_CHARGE_AMOUNT;
  const n = (x) => formatNumber(x, dir.lang);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.screen}>
      <ScreenHeaders title={t('Wallet recharge')} />
      <FormPage
        hero={{
          icon: 'card-outline',
          title: t('Wallet recharge'),
          subtitle: fa
            ? 'مبلغ را وارد یا انتخاب کنید؛ پس از پرداخت امن در درگاه بانکی، موجودی کیف پول بلافاصله به‌روز می‌شود.'
            : 'Enter or pick an amount; after paying securely through the bank gateway your balance updates right away.',
          badges: [{ icon: 'shield-checkmark-outline', label: fa ? 'درگاه امن شاپرک' : 'Secure Shaparak gateway' }],
        }}
        actions={
          <DButton
            title={valid ? (fa ? `پرداخت ${n(value)} تومان` : `Pay ${n(value)} Toman`) : t('Payment')}
            icon="lock-closed"
            variant="gold"
            size="lg"
            loading={loading}
            onPress={increaseWallet}
          />
        }
        actionsHint={fa ? 'با زدن «پرداخت» به درگاه بانک منتقل می‌شوید و پس از پرداخت به همین صفحه برمی‌گردید.' : 'You’ll go to the bank gateway and come back here after paying.'}
        aside={
          <>
            <View style={styles.balanceCard}>
              <View style={styles.stars} pointerEvents="none" />
              <View style={[styles.balanceHead, dir.row]}>
                <Ionicons name="wallet" size={18} color={palette.gold} />
                <Text style={[styles.balanceLabel, dir.light]}>{t('Your current wallet balance:')}</Text>
              </View>
              <Text style={[styles.balanceValue, dir.bold, dir.align]}>
                {n(walletBalance)} <Text style={[styles.balanceUnit, dir.light]}>{t('Tomans')}</Text>
              </Text>
              {valid && (
                <View style={[styles.after, dir.row]}>
                  <Ionicons name={dir.rtl ? 'arrow-back' : 'arrow-forward'} size={15} color={onDark.muted} />
                  <Text style={[styles.afterText, dir.light]}>{fa ? 'پس از شارژ' : 'After top-up'}</Text>
                  <Text style={[styles.afterValue, dir.bold]}>{n(Number(walletBalance) + value)}</Text>
                </View>
              )}
            </View>
            <TipsCard
              title={fa ? 'خوب است بدانید' : 'Good to know'}
              icon="information-circle-outline"
              items={
                fa
                  ? [`کمترین مبلغ ${n(MIN_CHARGE_AMOUNT)} و بیشترین ${n(MAX_CHARGE_AMOUNT)} تومان است`, 'موجودی فقط پس از تأیید بانک افزایش می‌یابد', 'از موجودی برای پرداخت سفارش‌ها استفاده کنید']
                  : [`Minimum ${n(MIN_CHARGE_AMOUNT)}, maximum ${n(MAX_CHARGE_AMOUNT)} Toman`, 'The balance rises only after the bank confirms', 'Use the balance to pay for orders']
              }
            />
          </>
        }
      >
        <FormSection index={0} icon="cash-outline" title={t('Enter your desired amount in Tomans.')} subtitle={fa ? 'یا یکی از مبلغ‌های آماده را انتخاب کنید' : 'Or pick one of the ready amounts'}>
          <View style={[styles.amountBox, dir.row, focused && styles.amountBoxFocused, !!amount && !valid && styles.amountBoxInvalid]}>
            <Ionicons name="cash-outline" size={26} color={focused ? palette.brandBright : surface.faint} />
            <TextInput
              style={[styles.amountInput, dir.bold]}
              keyboardType="number-pad"
              placeholder={t('Amount in Tomans')}
              placeholderTextColor={surface.faint}
              maxLength={10}
              value={amount?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              onChangeText={(text) => {
                setAmount(text?.replace(/,/g, ''));
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            <View style={styles.amountUnit}>
              <Text style={[styles.amountUnitText, dir.bold]}>{t('Tomans')}</Text>
            </View>
          </View>
          {!!amount && !valid && (
            <Text style={[styles.limit, dir.light, dir.align]}>
              {value < MIN_CHARGE_AMOUNT
                ? t('The minimum amount for wallet recharge is 10,000 Tomans')
                : t('The maximum amount for wallet recharge is 50,000,000 Tomans')}
            </Text>
          )}
          <View style={[styles.quick, dir.row]}>
            {QUICK.map((preset) => {
              const on = value === preset;
              return (
                <Pressable
                  key={preset}
                  onPress={() => setAmount(String(preset))}
                  accessibilityRole="button"
                  style={({ hovered }) => [styles.quickItem, hovered && !on && styles.quickHover, on && styles.quickOn]}
                >
                  <Text style={[styles.quickValue, dir.bold, on && styles.quickValueOn]}>{n(preset)}</Text>
                  <Text style={[styles.quickUnit, dir.light, on && styles.quickUnitOn]}>{t('Tomans')}</Text>
                </Pressable>
              );
            })}
          </View>
        </FormSection>
      </FormPage>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  amountBox: {
    alignItems: 'center',
    gap: 14,
    height: 76,
    paddingHorizontal: 18,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: surface.borderStrong,
    backgroundColor: surface.card,
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: motion.fast,
  },
  amountBoxFocused: { borderColor: palette.sky, boxShadow: elevation.focus },
  amountBoxInvalid: { borderColor: palette.danger },
  amountInput: { flex: 1, minWidth: 0, height: 70, fontSize: 28, color: surface.title, textAlign: 'center', outlineStyle: 'none', letterSpacing: 1 },
  amountUnit: { height: 40, paddingHorizontal: 14, borderRadius: radii.md, justifyContent: 'center', backgroundImage: gradients.brand },
  amountUnitText: { color: '#ffffff', fontSize: 13.5 },
  limit: { fontSize: 12.5, color: palette.danger },
  quick: { gap: 10, flexWrap: 'wrap' },
  quickItem: {
    flexGrow: 1,
    minWidth: 130,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: surface.borderStrong,
    backgroundColor: surface.card,
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color, transform',
    transitionDuration: motion.fast,
  },
  quickHover: { borderColor: 'rgba(233, 179, 8, 0.6)', transform: 'translateY(-1px)' },
  quickOn: { backgroundImage: gradients.gold, borderColor: 'transparent', boxShadow: elevation.gold },
  quickValue: { fontSize: 16, color: surface.title },
  quickValueOn: { color: palette.navy900 },
  quickUnit: { fontSize: 11.5, color: surface.faint },
  quickUnitOn: { color: 'rgba(6, 23, 45, 0.7)' },
  balanceCard: { padding: 22, gap: 8, borderRadius: radii.xl, overflow: 'hidden', backgroundImage: gradients.hero, boxShadow: elevation.raised },
  stars: { ...StyleSheet.absoluteFillObject, backgroundImage: gradients.stars },
  balanceHead: { alignItems: 'center', gap: 8 },
  balanceLabel: { color: onDark.muted, fontSize: 12.5 },
  balanceValue: { color: onDark.text, fontSize: 28, lineHeight: 42 },
  balanceUnit: { color: onDark.soft, fontSize: 13 },
  after: { alignItems: 'center', gap: 8, marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  afterText: { color: onDark.muted, fontSize: 12.5, flex: 1 },
  afterValue: { color: palette.gold, fontSize: 15 },
});
