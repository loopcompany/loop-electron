/**
 * DESKTOP OVERRIDE of loop-customer-mobile/org/logreg/Register.js
 *
 * Organisation sign-up redrawn for the desktop: a wide glass card (the
 * `authWide` layout) with the sixteen fields grouped into sections —
 * organisation, contact, CEO, representative, address, account — two fields
 * to a row, the organisation type as cards and the logo as a round picker.
 *
 * State, validation and the request are the mobile file's. Differences:
 *   - errors show in the form (per field, plus a summary by the button)
 *     instead of browser `alert()` / `confirm()` boxes; the server's
 *     validation errors, keyed by API field names, are shown on their fields
 *   - the logo is sent as a real file (the web has no `{ uri }` uploads)
 *   - after a successful sign-up it goes straight to the code step
 *   - no "test connection" (🔧) button
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import DatePickerModal from '@components/DatePickerModal';
import LocationPicker from '@components/LocationPicker';
import { uri } from '@services/URL';
import { jalaliToGregorian } from '@helpers/Common';
import { useSelector } from 'react-redux';
import { restartOtpRetriever, stopOtpRetriever } from '@screens/auth/OtpRetriever';

import {
  AccountSwitch,
  AuthAlert,
  AuthField,
  AuthFooter,
  AuthGrid,
  AuthHeader,
  AuthInput,
  AuthScreen,
  AuthSection,
  AvatarPicker,
  CaptchaField,
  CheckRow,
  ChoiceCards,
  PasswordInput,
  PickerInput,
  SubmitButton,
} from '@desktop/AuthKit';

const COPY = {
  fa: {
    eyebrow: 'پنل سازمان‌ها، شرکت‌ها و نهادهای دولتی',
    title: 'ثبت‌نام سازمان',
    subtitle: 'اطلاعات زیر را کامل کنید. پس از ثبت، یک کد تأیید به موبایل مدیرعامل پیامک می‌شود و کد سازمانی شما ساخته می‌شود.',
    org: 'اطلاعات سازمان',
    orgHint: 'نام و مشخصات حقوقی، همان‌طور که در مدارک ثبت شده است',
    logo: 'لوگو یا تصویر سازمان',
    logoHint: 'اختیاری — تصویر مربعی، حداکثر چند مگابایت',
    removeLogo: 'حذف تصویر',
    type: 'نوع سازمان',
    contact: 'راه‌های ارتباطی',
    contactHint: 'ایمیل و تلفن ثابت برای مکاتبات رسمی',
    ceo: 'مدیرعامل',
    ceoHint: 'کد تأیید به موبایل مدیرعامل ارسال می‌شود',
    agent: 'نماینده‌ی مدیرعامل',
    agentHint: 'فردی که سفارش‌ها را پیگیری می‌کند',
    address: 'نشانی سازمان',
    account: 'امنیت حساب',
    accountHint: 'با کد سازمانی و این رمز وارد پنل می‌شوید',
    optional: 'اختیاری',
    pickDate: 'انتخاب تاریخ',
    landlinePlaceholder: '۸ رقم',
    postalPlaceholder: '۱۰ رقم، بدون خط تیره',
    haveAccount: 'قبلاً ثبت‌نام کرده‌اید؟',
    signIn: 'ورود سازمانی',
    submit: 'ثبت‌نام و دریافت کد تأیید',
    fixFields: (n) => `${n.toLocaleString('fa-IR')} مورد نیاز به اصلاح دارد؛ فیلدهای قرمز را بررسی کنید.`,
    noServer: 'سرور پاسخ نمی‌دهد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.',
  },
  en: {
    eyebrow: 'For organisations, companies and government bodies',
    title: 'Register your organisation',
    subtitle: "Fill in the details below. We'll text a verification code to the CEO's mobile and create your organisation code.",
    org: 'Organisation',
    orgHint: 'Name and legal details, as registered',
    logo: 'Logo or organisation image',
    logoHint: 'Optional — a square image, a few MB at most',
    removeLogo: 'Remove image',
    type: 'Organisation type',
    contact: 'Contact',
    contactHint: 'Email and landline for official correspondence',
    ceo: 'CEO',
    ceoHint: "The verification code goes to the CEO's mobile",
    agent: "CEO's representative",
    agentHint: 'The person who follows up on orders',
    address: 'Address',
    account: 'Account security',
    accountHint: "You'll sign in with the organisation code and this password",
    optional: 'optional',
    pickDate: 'Pick a date',
    landlinePlaceholder: '8 digits',
    postalPlaceholder: '10 digits, no dashes',
    haveAccount: 'Already registered?',
    signIn: 'Organisation sign-in',
    submit: 'Register and get the code',
    fixFields: (n) => `${n} ${n === 1 ? 'field needs' : 'fields need'} attention — check the ones in red.`,
    noServer: 'The server is not responding. Check your internet connection and try again.',
  },
};

/** Server validation keys → the form's field names, so their messages land on the right field. */
const SERVER_FIELDS = {
  organization_name: 'organizationName',
  business_name: 'businessName',
  agent_name: 'agentName',
  agent_phone: 'agentPhone',
  history: 'history',
  organization_email: 'organizationEmail',
  organization_phone: 'organizationPhoneNumber',
  organization_address: 'organizationAddress',
  manager_full_name: 'familyName',
  manager_national_code: 'nationalCode',
  melicode: 'nationalID',
  account_type: 'accountType',
  manager_mobile: 'mobileNumber',
  manager_birthdate: 'birthDate',
  region: 'region',
  region_id: 'region',
  postal_code: 'organizationPostalCode',
  password: 'password',
  profile_image: 'profileImage',
};

const Register = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const copy = COPY[i18n.language === 'fa' ? 'fa' : 'en'];

  const hashApp = useSelector(state=>state.hashApp?.hash)
  // Form states
  const [accountType, setAccountType] = useState('g_organization');
  const [profileImage, setProfileImage] = useState(null);
  const [organizationName, setOrganizationName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [familyName, setFamilyName] = useState('');

  const [agentName, setAgentName] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [history, setHistory] = useState('');

  const [nationalCode, setNationalCode] = useState('');
  const [nationalID, setNationalID] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [organizationPhoneNumber, setOrganizationPhoneNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [organizationEmail, setOrganizationEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('تهران');
  const [region, setRegion] = useState('');
  const [organizationAddress, setOrganizationAddress] = useState('');
  const [organizationPostalCode, setOrganizationPostalCode] = useState('');
  const [securityCode, setSecurityCode] = useState('');

  // Location states
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);

  // UI states
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [datePickerModal, setDatePickerModal] = useState(false);

  // Generate random captcha code
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const [displayedCaptcha, setDisplayedCaptcha] = useState(generateCaptcha());

  // Initialize captcha on component mount
  useEffect(() => {
    setDisplayedCaptcha(generateCaptcha());
  }, []);

  // Validation functions
  const validateNationalCode = (code) => {
    if (!/^\d{10}$/.test(code)) return false;
    const check = parseInt(code[9]);
    const sum = code.split('').slice(0, 9)
      .reduce((acc, digit, i) => acc + parseInt(digit) * (10 - i), 0);
    const remainder = sum % 11;
    return (remainder < 2 && check === remainder) ||
      (remainder >= 2 && check === 11 - remainder);
  };

  const validateMobile = (mobile) => {
    return /^09\d{9}$/.test(mobile);
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePostalCode = (code) => {
    return /^\d{10}$/.test(code);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!acceptTerms) {
      newErrors.acceptTerms = t('Acceptance of the rules and regulations is mandatory.');
    }
    if (!organizationName || organizationName.length < 2) {
      newErrors.organizationName = t('Organization name must be at least 2 characters');
    }

    if (!familyName || familyName.length < 2) {
      newErrors.familyName = t('Manager full name must be at least 2 characters');
    }

    if (!agentName || agentName.length < 2) {
      newErrors.agentName = t('Agent name must be at least 2 characters');
    }

    if (!agentPhone) {
      newErrors.agentPhone = t('Agent phone number is required');
    } else if (!validateMobile(agentPhone)) {
      newErrors.agentPhone = t('Agent phone number must be 11 digits and start with 09');
    }

    if (!history || history.length < 2) {
      newErrors.history = t('Records must be at least 2 characters');
    }

    if (!nationalCode) {
      newErrors.nationalCode = t('National ID is required');
    } else if (!validateNationalCode(nationalCode)) {
      newErrors.nationalCode = t('National ID is invalid');
    }
    if (!nationalID) {
      newErrors.nationalID = t('National Identifier is required');
    }

    if (!mobileNumber) {
      newErrors.mobileNumber = t('Mobile number is required');
    } else if (!validateMobile(mobileNumber)) {
      newErrors.mobileNumber = t('Mobile number must be 11 digits and start with 09');
    }

    if (!birthDate) {
      newErrors.birthDate = t('Birth date is required');
    }

    if (!organizationEmail) {
      newErrors.organizationEmail = t('Email address is required');
    } else if (!validateEmail(organizationEmail)) {
      newErrors.organizationEmail = t('The email address you entered is not valid.');
    }

    if (!organizationPhoneNumber) {
      newErrors.organizationPhoneNumber = t('Organization landline number is required');
    }

    if (!password || password.length < 8) {
      newErrors.password = t('Password must be at least 8 characters');
    }


    if (!selectedRegion) {
      newErrors.region = t('Region is required');
    }

    if (!organizationAddress || organizationAddress.length < 10) {
      newErrors.organizationAddress = t('Address must be at least 10 characters');
    }

    if (!organizationPostalCode) {
      newErrors.organizationPostalCode = t('Postal code is required');
    } else if (!validatePostalCode(organizationPostalCode)) {
      newErrors.organizationPostalCode = t('Postal code must be 10 digits');
    }

    // Captcha validation
    if (!securityCode) {
      newErrors.securityCode = t('Security code is required');
    } else if (securityCode.toLowerCase() !== displayedCaptcha.toLowerCase()) {
      newErrors.securityCode = t('Security code is incorrect');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Image picker function
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        setErrors((prev) => ({ ...prev, profileImage: t('Gallery access is required') }));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0]);
        setErrors((prev) => ({ ...prev, profileImage: null }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setErrors((prev) => ({ ...prev, profileImage: t('Error selecting image') }));
    }
  };

  /** The picked image as a File the web FormData can send. */
  const imageFile = async (asset) => {
    if (asset.file) return asset.file;
    const blob = await (await fetch(asset.uri)).blob();
    const ext = (blob.type.split('/')[1] || 'jpeg').replace('+xml', '');
    return new File([blob], `profile.${ext}`, { type: blob.type || 'image/jpeg' });
  };

  // Register handler
  const handleRegister = async () => {
    if (loading) return;

    // Clear previous errors
    setErrors({});

    // Validate form (captcha included)
    if (!validateForm()) {
      if (securityCode && securityCode.toLowerCase() !== displayedCaptcha.toLowerCase()) {
        setDisplayedCaptcha(generateCaptcha());
        setSecurityCode('');
      }
      return;
    }

    setLoading(true);

    try {
      // Convert Jalali date to Gregorian for API
      const gregorianDate = jalaliToGregorian(birthDate);

      // Create FormData
      const formData = new FormData();

      // Add image if selected
      if (profileImage) {
        if (Platform.OS === 'web') {
          formData.append('profile_image', await imageFile(profileImage));
        } else {
          const uriParts = profileImage.uri.split('.');
          const fileType = uriParts[uriParts.length - 1];

          formData.append('profile_image', {
            uri: profileImage.uri,
            name: `profile.${fileType}`,
            type: `image/${fileType}`,
          });
        }
      }

      // Add all form fields
      formData.append('organization_name', organizationName);

      formData.append('business_name', businessName);

      formData.append('agent_name', agentName);
      formData.append('agent_phone', agentPhone);
      formData.append('history', history);
      formData.append('organization_email', organizationEmail);
      formData.append('organization_phone', '021' + organizationPhoneNumber);
      formData.append('organization_address', organizationAddress);
      formData.append('manager_full_name', familyName);
      formData.append('manager_national_code', nationalCode);
      formData.append('melicode', nationalID);
      formData.append('account_type', accountType);
      formData.append('manager_mobile', mobileNumber);
      formData.append('manager_birthdate', gregorianDate);  // Send Gregorian date to API
      formData.append('city', city);
      formData.append('region', region);
      formData.append('postal_code', organizationPostalCode);
      formData.append('password', password);
      formData.append('password_confirmation', password);
      formData.append('hashApp', hashApp?.[0] ?? '');

      if (selectedRegion) {
        formData.append('region_id', selectedRegion.id);
      }

      if (Platform.OS === 'android') {
        try {
          await restartOtpRetriever();
        } catch (otpError) {
          console.warn('OTP Retriever start error:', otpError);
        }
      }

      // Make API call with timeout
      const response = await axios.post(
        `${uri}/organization/register`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      console.log('✅ Registration successful:', response.data);

      if (response.data.status === 'success') {
        navigation.navigate('OTPVerification', {
          phone: mobileNumber,
          organizationCode: response.data.data.organization_code,
          userId: response.data.data.user_id,
          organizationId: response.data.data.organization_id,
        });
      } else {
        stopOtpRetriever({ clearPending: true });
        setErrors({ general: response.data.message || t('Registration error') });
      }
    } catch (error) {
      stopOtpRetriever({ clearPending: true });

      if (error.response) {
        // Server responded with error (4xx, 5xx)
        console.log('Server response:', error.response.data);
        const errorData = error.response.data;

        if (errorData.errors) {
          // Validation errors from server, on their fields where the form has one
          const serverErrors = {};
          const unplaced = [];
          Object.keys(errorData.errors).forEach((key) => {
            const message = errorData.errors[key][0];
            if (SERVER_FIELDS[key]) serverErrors[SERVER_FIELDS[key]] = message;
            else unplaced.push(message);
          });
          serverErrors.general = [errorData.message || t('Please check the fields'), ...unplaced].join('\n');
          setErrors(serverErrors);
        } else {
          setErrors({ general: errorData.message || t('Registration error') });
        }
      } else if (error.request) {
        // Request made but no response (network error)
        console.log('No response received');
        setErrors({ general: copy.noServer });
      } else {
        // Something else happened
        console.log('Unknown error:', error.message);
        setErrors({ general: `${t('Unknown error:')} ${error.message}` });
      }
    } finally {
      setLoading(false);
    }
  };

  /** A setter that also clears the field's error. */
  const bind = (setter, field) => (value) => {
    setter(value);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const fieldErrorCount = Object.entries(errors).filter(([key, value]) => key !== 'general' && !!value).length;
  const submit = handleRegister;

  return (
    <AuthScreen wide>
      <AccountSwitch value="organization" onChange={() => navigation.replace('MainSignIn')} disabled={loading} />

      <AuthHeader eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle} />

      <AuthSection index={0} icon="business-outline" title={copy.org} subtitle={copy.orgHint}>
        <AvatarPicker
          uri={profileImage?.uri}
          title={profileImage ? t('Change profile image') : copy.logo}
          hint={errors.profileImage || copy.logoHint}
          onPress={pickImage}
          onRemove={() => setProfileImage(null)}
          removeLabel={copy.removeLogo}
        />
        <AuthField label={copy.type} required error={errors.accountType}>
          <ChoiceCards
            value={accountType}
            onChange={bind(setAccountType, 'accountType')}
            options={[
              { value: 'g_organization', icon: 'shield-outline', label: t('Government organization') },
              { value: 's_g_organization', icon: 'git-network-outline', label: t('Semi-governmental organization') },
              { value: 'company', icon: 'briefcase-outline', label: t('Private company') },
            ]}
          />
        </AuthField>
        <AuthGrid>
          <AuthField half label={t('Organization name')} required error={errors.organizationName}>
            <AuthInput
              icon="business-outline"
              value={organizationName}
              onChangeText={bind(setOrganizationName, 'organizationName')}
              placeholder={t('Organization name')}
              invalid={!!errors.organizationName}
              onSubmitEditing={submit}
            />
          </AuthField>
          <AuthField half label={`${t('Business name')} (${copy.optional})`} error={errors.businessName}>
            <AuthInput
              icon="pricetag-outline"
              value={businessName}
              onChangeText={bind(setBusinessName, 'businessName')}
              placeholder={t('Business name')}
              invalid={!!errors.businessName}
              onSubmitEditing={submit}
            />
          </AuthField>
          <AuthField half label={t('National Identifier')} required error={errors.nationalID}>
            <AuthInput
              icon="finger-print-outline"
              ltr
              value={nationalID}
              onChangeText={bind(setNationalID, 'nationalID')}
              placeholder={t('National Identifier')}
              digits
              inputMode="numeric"
              invalid={!!errors.nationalID}
              onSubmitEditing={submit}
            />
          </AuthField>
          <AuthField half label={t('Records')} required error={errors.history}>
            <AuthInput
              icon="time-outline"
              value={history}
              onChangeText={bind(setHistory, 'history')}
              placeholder={t('Records')}
              invalid={!!errors.history}
              onSubmitEditing={submit}
            />
          </AuthField>
        </AuthGrid>
      </AuthSection>

      <AuthSection index={1} icon="call-outline" title={copy.contact} subtitle={copy.contactHint}>
        <AuthGrid>
          <AuthField half label={t('Organization email address')} required error={errors.organizationEmail}>
            <AuthInput
              icon="mail-outline"
              ltr
              value={organizationEmail}
              onChangeText={bind(setOrganizationEmail, 'organizationEmail')}
              placeholder="info@company.ir"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              invalid={!!errors.organizationEmail}
              onSubmitEditing={submit}
            />
          </AuthField>
          <AuthField half label={t('Organization landline number')} required error={errors.organizationPhoneNumber}>
            <AuthInput
              icon="call-outline"
              ltr
              prefix="021-"
              value={organizationPhoneNumber}
              onChangeText={bind(setOrganizationPhoneNumber, 'organizationPhoneNumber')}
              placeholder={copy.landlinePlaceholder}
              digits
              inputMode="tel"
              maxLength={8}
              invalid={!!errors.organizationPhoneNumber}
              onSubmitEditing={submit}
            />
          </AuthField>
        </AuthGrid>
      </AuthSection>

      <AuthSection index={2} icon="person-outline" title={copy.ceo} subtitle={copy.ceoHint}>
        <AuthGrid>
          <AuthField half label={t('Manager full name')} required error={errors.familyName}>
            <AuthInput
              icon="person-outline"
              value={familyName}
              onChangeText={bind(setFamilyName, 'familyName')}
              placeholder={t('Manager full name')}
              autoComplete="name"
              invalid={!!errors.familyName}
              onSubmitEditing={submit}
            />
          </AuthField>
          <AuthField half label={t('Manager national ID')} required error={errors.nationalCode}>
            <AuthInput
              icon="id-card-outline"
              ltr
              value={nationalCode}
              onChangeText={bind(setNationalCode, 'nationalCode')}
              placeholder="0012345678"
              digits
              inputMode="numeric"
              maxLength={10}
              invalid={!!errors.nationalCode}
              onSubmitEditing={submit}
            />
          </AuthField>
          <AuthField half label={t('Manager mobile number')} required error={errors.mobileNumber}>
            <AuthInput
              icon="phone-portrait-outline"
              ltr
              value={mobileNumber}
              onChangeText={bind(setMobileNumber, 'mobileNumber')}
              placeholder="09123456789"
              digits
              inputMode="tel"
              maxLength={11}
              invalid={!!errors.mobileNumber}
              onSubmitEditing={submit}
            />
          </AuthField>
          <AuthField half label={t('Birth date')} required error={errors.birthDate}>
            <PickerInput
              value={birthDate}
              placeholder={copy.pickDate}
              onPress={() => setDatePickerModal(true)}
              invalid={!!errors.birthDate}
            />
          </AuthField>
        </AuthGrid>
      </AuthSection>

      <AuthSection index={3} icon="people-outline" title={copy.agent} subtitle={copy.agentHint}>
        <AuthGrid>
          <AuthField half label={t("Name of the CEO's representative")} required error={errors.agentName}>
            <AuthInput
              icon="person-circle-outline"
              value={agentName}
              onChangeText={bind(setAgentName, 'agentName')}
              placeholder={t("Name of the CEO's representative")}
              invalid={!!errors.agentName}
              onSubmitEditing={submit}
            />
          </AuthField>
          <AuthField half label={t('CEO Representative Phone')} required error={errors.agentPhone}>
            <AuthInput
              icon="phone-portrait-outline"
              ltr
              value={agentPhone}
              onChangeText={bind(setAgentPhone, 'agentPhone')}
              placeholder="09123456789"
              digits
              inputMode="tel"
              maxLength={11}
              invalid={!!errors.agentPhone}
              onSubmitEditing={submit}
            />
          </AuthField>
        </AuthGrid>
      </AuthSection>

      <AuthSection index={4} icon="location-outline" title={copy.address}>
        <AuthGrid>
          <AuthField half label={t('Region')} required error={errors.region}>
            <LocationPicker
              selectedProvince={selectedProvince}
              selectedCity={selectedCity}
              selectedRegion={selectedRegion}
              onProvinceChange={setSelectedProvince}
              onCityChange={setSelectedCity}
              onRegionChange={(value) => {
                setSelectedRegion(value);
                if (errors.region) setErrors((prev) => ({ ...prev, region: null }));
              }}
              required={true}
            />
          </AuthField>
          <AuthField half label={t('Organization postal code')} required error={errors.organizationPostalCode}>
            <AuthInput
              icon="mail-open-outline"
              ltr
              value={organizationPostalCode}
              onChangeText={bind(setOrganizationPostalCode, 'organizationPostalCode')}
              placeholder={copy.postalPlaceholder}
              digits
              inputMode="numeric"
              maxLength={10}
              invalid={!!errors.organizationPostalCode}
              onSubmitEditing={submit}
            />
          </AuthField>
          <AuthField full label={t('Organization address')} required error={errors.organizationAddress}>
            <AuthInput
              icon="navigate-outline"
              multiline
              rows={2}
              value={organizationAddress}
              onChangeText={bind(setOrganizationAddress, 'organizationAddress')}
              placeholder={t('Organization address')}
              invalid={!!errors.organizationAddress}
            />
          </AuthField>
        </AuthGrid>
      </AuthSection>

      <AuthSection index={5} icon="lock-closed-outline" title={copy.account} subtitle={copy.accountHint}>
        <AuthGrid>
          <AuthField half label={t('Password')} required error={errors.password}>
            <PasswordInput
              value={password}
              onChangeText={bind(setPassword, 'password')}
              placeholder={t('Password must be at least 8 characters')}
              autoComplete="new-password"
              invalid={!!errors.password}
              onSubmitEditing={submit}
            />
          </AuthField>
          <CaptchaField
            half
            uppercase
            code={displayedCaptcha}
            value={securityCode}
            onChangeText={bind(setSecurityCode, 'securityCode')}
            onRefresh={() => {
              setDisplayedCaptcha(generateCaptcha());
              setSecurityCode('');
            }}
            error={errors.securityCode}
            onSubmitEditing={submit}
          />
        </AuthGrid>
        <AuthField error={errors.acceptTerms}>
          <CheckRow checked={acceptTerms} onChange={bind(setAcceptTerms, 'acceptTerms')} invalid={!!errors.acceptTerms}>
            {t("By continuing, I accept Loop's Terms of Use and Privacy Policy.")}
          </CheckRow>
        </AuthField>
      </AuthSection>

      {!!errors.general && <AuthAlert kind="error">{errors.general}</AuthAlert>}
      {!errors.general && fieldErrorCount > 0 && <AuthAlert kind="warning">{copy.fixFields(fieldErrorCount)}</AuthAlert>}

      <SubmitButton title={copy.submit} icon="forward" loading={loading} onPress={submit} />

      <AuthFooter text={copy.haveAccount} link={copy.signIn} onPress={() => navigation.navigate('Login')} disabled={loading} />

      {/* DatePicker Modal */}
      <DatePickerModal
        datePickerModal={datePickerModal}
        setDatePickerModal={setDatePickerModal}
        birthDate={birthDate}
        setBirthDate={bind(setBirthDate, 'birthDate')}
      />
    </AuthScreen>
  );
};

export default Register;
