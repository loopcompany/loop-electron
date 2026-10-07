/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/auth/MainSignIn.js
 *
 * Customer sign-up redrawn for the desktop glass card (@desktop/AuthKit):
 * national ID and mobile side by side, the referral code as one field with
 * its fixed "L-" prefix, the captcha as one control, the terms as a real
 * checkbox and Enter to submit.
 *
 * State, validation and the request are the mobile file's. The "code sent"
 * toast (a blocking `alert()` on the web) is dropped: the verification
 * screen that follows says it.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useReducer, useEffect, useCallback } from "react";
import { Linking } from "react-native";
import { authAPI } from "@services/Api";
import { showToastOrAlert } from "@helpers/Common";
import { useTranslation } from "react-i18next";
import { restartOtpRetriever, stopOtpRetriever } from "./OtpRetriever";
import { useSelector, useDispatch } from "react-redux";
import { fetchPdfDocs } from "@slices/pdfDocumentSlice";
import { imageUri } from "@services/URL";

import {
    AccountSwitch,
    AuthAlert,
    AuthField,
    AuthFields,
    AuthFooter,
    AuthGrid,
    AuthHeader,
    AuthInput,
    AuthScreen,
    CaptchaField,
    CheckRow,
    InlineLink,
    SubmitButton,
    TextLink,
} from '@desktop/AuthKit';

const COPY = {
    fa: {
        title: 'ساخت حساب لوپ',
        subtitle: 'چند اطلاعات کوتاه؛ بعد یک کد تأیید به موبایلتان پیامک می‌شود.',
        haveAccount: 'قبلاً ثبت‌نام کرده‌اید؟',
        signIn: 'وارد شوید',
        melicodePlaceholder: '۱۰ رقم',
        phonePlaceholder: '۰۹۱۲۳۴۵۶۷۸۹',
        emailPlaceholder: 'name@example.com',
        referral: 'کد معرف',
        referralHint: 'اختیاری — اگر کسی لوپ را به شما معرفی کرده، کد ۵ کاراکتری او را وارد کنید.',
        referralPlaceholder: 'XXXXX',
        noEmail: 'ایمیل ندارید؟',
        submit: 'ثبت‌نام و دریافت کد',
    },
    en: {
        title: 'Create your Loop account',
        subtitle: 'A few quick details, then we text a verification code to your mobile.',
        haveAccount: 'Already registered?',
        signIn: 'Sign in',
        melicodePlaceholder: '10 digits',
        phonePlaceholder: '09123456789',
        emailPlaceholder: 'name@example.com',
        referral: 'Referral code',
        referralHint: 'Optional — if someone referred you to Loop, enter their 5-character code.',
        referralPlaceholder: 'XXXXX',
        noEmail: 'No email address?',
        submit: 'Sign up and get the code',
    },
};

const initialState = {
    melicode: '',
    phone: '',
    email: '',
    otherReferralCode: '',
    captchaInput: '',
    captcha: Math.floor(1000 + Math.random() * 9000).toString(),
    province: null,
    city: null,
    region: null,
    errors: {},
    isLoading: false,
    acceptTerms: false

};

const formReducer = (state, action) => {
    switch (action.type) {
        case 'SET_FIELD':
            return {
                ...state,
                [action.field]: action.value,
                errors: { ...state.errors, [action.field]: null }
            };
        case 'SET_ERROR':
            return {
                ...state,
                errors: { ...state.errors, [action.field]: action.error }
            };
        case 'SET_ERRORS':
            return { ...state, errors: action.errors };
        case 'SET_LOADING':
            return { ...state, isLoading: action.isLoading };
        case 'GENERATE_CAPTCHA':
            return {
                ...state,
                captcha: Math.floor(1000 + Math.random() * 9000).toString(),
                captchaInput: ''
            };
        case 'CLEAR_FORM':
            return { ...initialState, captcha: state.captcha };
        default:
            return state;
    }
};

export default function MainSignIn({ navigation }) {
    const [state, dispatch] = useReducer(formReducer, initialState);
    const storeDispatch = useDispatch();
    const hashApp = useSelector(state => state.hashApp?.hash)
    // `pdf.user` is the customer-app terms & conditions PDF (see slices/pdfDocumentSlice.js)
    const termsPdfPath = useSelector(state => state.pdf?.data?.user)

    const inviteLetter = 'L'; // Static invite letter
    const { t, i18n } = useTranslation();
    const copy = COPY[i18n.language === 'fa' ? 'fa' : 'en'];

    // The PDF list is normally fetched on Landing; refetch when this screen is
    // opened directly by URL (web) so the terms link still resolves.
    useEffect(() => {
        if (!termsPdfPath) {
            storeDispatch(fetchPdfDocs());
        }
    }, [termsPdfPath, storeDispatch]);

    const openTermsPdf = useCallback(async () => {
        if (!termsPdfPath) {
            showToastOrAlert(t('Terms and conditions file is not available.'));
            return;
        }
        try {
            await Linking.openURL(`${imageUri}/${termsPdfPath}`);
        } catch (error) {
            console.warn('Unable to open terms PDF:', error);
            showToastOrAlert(t('Terms and conditions file is not available.'));
        }
    }, [termsPdfPath, t]);

    // Form validation
    const validateForm = () => {
        const errors = {};

        if (!state.acceptTerms) {

            errors.acceptTerms = t('Acceptance of the rules and regulations is mandatory.');
        }

        // Melicode validation (10 digits)
        if (!state.melicode) {
            errors.melicode = t("National ID is required");
        } else if (state.melicode.length !== 10 || !/^\d{10}$/.test(state.melicode)) {
            errors.melicode = t("National ID must be 10 digits");
        }

        // Phone validation (11 digits starting with 09)
        if (!state.phone) {
            errors.phone = t("Mobile number is required");
        } else if (state.phone.length !== 11 || !/^09\d{9}$/.test(state.phone)) {
            errors.phone = t("Mobile number must be 11 digits and start with 09");
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!state.email) {
            errors.email = t("Email address is required");
        } else if (!emailRegex.test(state.email)) {
            errors.email = t("Invalid email format");
        }

        // Captcha validation
        if (!state.captchaInput) {
            errors.captchaInput = t("Security code is required");
        } else if (state.captchaInput !== state.captcha) {
            errors.captchaInput = t("Security code is incorrect");
        }

        return errors;
    };

    // Handle form submission
    const handleRegistration = async () => {
        if (state.isLoading) return;
        const errors = validateForm();

        if (Object.keys(errors).length > 0) {
            dispatch({ type: 'SET_ERRORS', errors });
            return;
        }

        dispatch({ type: 'SET_LOADING', isLoading: true });

        try {
            try {
                await restartOtpRetriever();
            } catch (otpError) {
                console.log('SMS Retriever start error:', otpError);
            }

            const userData = {
                melicode: state.melicode,
                phone: state.phone,
                email: state.email,
                province_id: state.province?.id,
                city_id: state.city?.id,
                region_id: state.region?.id,
                other_referral_code: state.otherReferralCode ? `${inviteLetter}${state.otherReferralCode}` : null,
                hashApp: hashApp?.[0]
            };

            const response = await authAPI.register(userData);

            if (response.success) {
                // Navigate to verification screen
                navigation.navigate('RegistrationVerificationScreen', {
                    phone: state.phone,
                    userData
                });
            } else {
                stopOtpRetriever({ clearPending: true });
                dispatch({
                    type: 'SET_ERROR',
                    field: 'general',
                    error: response.message || t("Registration failed")
                });
            }
        } catch (error) {
            stopOtpRetriever({ clearPending: true });
            console.log('Registration error:', error);
            let errorMessage = t("Registration failed. Please try again");

            if (error.response?.data?.errors) {
                // Handle field-specific errors from backend
                const backendErrors = {};
                Object.keys(error.response.data.errors).forEach(field => {
                    backendErrors[field] = error.response.data.errors[field][0];
                });
                dispatch({ type: 'SET_ERRORS', errors: backendErrors });
                return;
            }

            dispatch({ type: 'SET_ERROR', field: 'general', error: errorMessage });
        } finally {
            dispatch({ type: 'SET_LOADING', isLoading: false });
        }
    };

    const generateCaptcha = () => {
        dispatch({ type: 'GENERATE_CAPTCHA' });
    };

    const setField = (field) => (value) => dispatch({ type: 'SET_FIELD', field, value });

    // backend errors keyed by API field names that have no field of their own here
    const otherErrors = Object.entries(state.errors)
        .filter(([key, value]) => value && !['general', 'melicode', 'phone', 'email', 'otherReferralCode', 'other_referral_code', 'captchaInput', 'acceptTerms'].includes(key))
        .map(([, value]) => value);

    return (
        <AuthScreen>
            <AccountSwitch value="individual" onChange={() => navigation.replace('Register')} disabled={state.isLoading} />

            <AuthHeader title={copy.title} subtitle={copy.subtitle} />

            {!!state.errors.general && <AuthAlert kind="error">{state.errors.general}</AuthAlert>}
            {otherErrors.length > 0 && <AuthAlert kind="error">{otherErrors.join('\n')}</AuthAlert>}

            <AuthFields>
                <AuthGrid>
                    <AuthField half label={t("National ID")} required error={state.errors.melicode}>
                        <AuthInput
                            icon="id-card-outline"
                            ltr
                            value={state.melicode}
                            onChangeText={setField('melicode')}
                            placeholder={copy.melicodePlaceholder}
                            digits
                            inputMode="numeric"
                            maxLength={10}
                            invalid={!!state.errors.melicode}
                            onSubmitEditing={handleRegistration}
                            autoFocus
                        />
                    </AuthField>
                    <AuthField half label={t("Mobile number")} required error={state.errors.phone}>
                        <AuthInput
                            icon="phone-portrait-outline"
                            ltr
                            value={state.phone}
                            onChangeText={setField('phone')}
                            placeholder={copy.phonePlaceholder}
                            digits
                            inputMode="tel"
                            autoComplete="tel"
                            maxLength={11}
                            invalid={!!state.errors.phone}
                            onSubmitEditing={handleRegistration}
                        />
                    </AuthField>
                </AuthGrid>

                <AuthField
                    label={t("Email address")}
                    required
                    error={state.errors.email}
                    aside={
                        <TextLink
                            title={copy.noEmail}
                            icon="open-outline"
                            muted
                            onPress={() => Linking.openURL('https://accounts.google.com/signup/v2/webcreateaccount?service=mail')}
                        />
                    }
                >
                    <AuthInput
                        icon="mail-outline"
                        ltr
                        value={state.email}
                        onChangeText={setField('email')}
                        placeholder={copy.emailPlaceholder}
                        inputMode="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        invalid={!!state.errors.email}
                        onSubmitEditing={handleRegistration}
                    />
                </AuthField>

                <AuthField
                    label={copy.referral}
                    hint={copy.referralHint}
                    error={state.errors.otherReferralCode || state.errors.other_referral_code}
                >
                    <AuthInput
                        icon="gift-outline"
                        ltr
                        prefix={`${inviteLetter}-`}
                        value={state.otherReferralCode}
                        onChangeText={setField('otherReferralCode')}
                        placeholder={copy.referralPlaceholder}
                        maxLength={5}
                        autoCapitalize="none"
                        autoCorrect={false}
                        invalid={!!(state.errors.otherReferralCode || state.errors.other_referral_code)}
                        onSubmitEditing={handleRegistration}
                    />
                </AuthField>

                <CaptchaField
                    code={state.captcha}
                    value={state.captchaInput}
                    onChangeText={setField('captchaInput')}
                    onRefresh={generateCaptcha}
                    error={state.errors.captchaInput}
                    onSubmitEditing={handleRegistration}
                />

                <AuthField error={state.errors.acceptTerms}>
                    <CheckRow
                        checked={state.acceptTerms}
                        onChange={setField('acceptTerms')}
                        invalid={!!state.errors.acceptTerms}
                    >
                        {t('By continuing, I accept')}{' '}
                        <InlineLink onPress={openTermsPdf}>{t("Loop's Terms of Use and Privacy Policy")}</InlineLink>
                        {t('terms acceptance suffix')}
                    </CheckRow>
                </AuthField>
            </AuthFields>

            <SubmitButton
                title={copy.submit}
                icon="forward"
                loading={state.isLoading}
                onPress={handleRegistration}
            />

            <AuthFooter
                text={copy.haveAccount}
                link={copy.signIn}
                onPress={() => navigation.navigate('LoginScreen')}
                disabled={state.isLoading}
            />
        </AuthScreen>
    );
}
