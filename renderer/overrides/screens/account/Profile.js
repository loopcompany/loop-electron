/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/account/Profile.js
 *
 * The individual user's account page as a desktop settings page
 * (@desktop/FormKit): an identity card (photo, name, user code) with the
 * account switches and sign-out in the side column, and the details grouped
 * into cards — personal, district & addresses, bank, password — with the
 * fields in two columns. On a phone it is one long column of inputs.
 *
 * All logic is the mobile file's, copied verbatim: loading and validating
 * the profile, the photo picker, the captcha-guarded password change,
 * auto-login and sign-out. Organisation accounts still get
 * OrganizationProfile, as on the phone.
 *
 * When the mobile file changes, `npm run check:overrides` fails: port the
 * change here, then run `npm run overrides:accept`.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Image, Pressable, I18nManager, Platform, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import useLogout from '@hooks/useLogout';
import ScreenHeaders from '@components/ScreenHeaders';
import Loader from '@components/Loader';
import { userAPI } from '@services/Api';
import TokenManager from '@services/TokenManager';
import { isLocalUri, showAlert, showToastOrAlert, langIsRTL } from '@helpers/Common';
import DatePickerModal from '@components/DatePickerModal';
import { Ionicons } from '@expo/vector-icons';
import OrganizationProfile from './OrganizationProfile';
import * as ImagePicker from 'expo-image-picker';
import { imageUri } from '@services/URL';
import { createStyles } from '@styles/NewStyles';
import LocationPicker from '@components/LocationPicker';
import { fetchUser } from '@slices/userSlice';
import { checkAppVersion, isNotImplemented } from '@services/AccountSecurityApi';
import { getAppVersion } from '@services/notifications/deviceInfo';
import { clearAccountProfileCache } from '@services/receipt/receiptProfile';

import { DButton, IconButton, Pill, useDir } from '@desktop/ui';
import { Field, FieldGrid, FormPage, FormSection, SelectField, TextField, Toggle } from '@desktop/FormKit';
import { elevation, gradients, motion, onDark, palette, radii, surface, tone } from '@desktop/desktopTheme';
import { contentGutter, contentMaxWidth } from '@desktop/Breakpoints';

/**
 * The rows of the mobile AccountActionsCard (components/account/
 * OrganizationAccountSections) as theme-aware desktop rows: the same targets,
 * labels and app-version check.
 */
function AccountLinks({ navigation }) {
    const { t } = useTranslation();
    const dir = useDir();
    const [checking, setChecking] = useState(false);
    const version = getAppVersion() || '-';

    const checkVersion = async () => {
        setChecking(true);
        const result = await checkAppVersion();
        setChecking(false);
        if (!result.ok) {
            showToastOrAlert(
                isNotImplemented(result)
                    ? t('Checking for updates will be available soon.')
                    : result.message || t('The operation failed. Please try again.')
            );
            return;
        }
        const info = result.data || {};
        if (info.update_available && info.update_url) {
            showAlert(
                t('Update available'),
                t('Version {{version}} of the app is available.', { version: info.latest_version || '' }),
                [
                    ...(info.force ? [] : [{ text: t('Later'), style: 'cancel' }]),
                    { text: t('Update'), onPress: () => Linking.openURL(info.update_url) },
                ]
            );
        } else {
            showToastOrAlert(t('You are using the latest version.'));
        }
    };

    const rows = [
        { icon: 'shield-half-outline', title: t('Account security'), subtitle: t('Two-step verification, devices, sessions, alerts'), onPress: () => navigation.navigate('AccountSecurity') },
        { icon: 'shield-checkmark-outline', title: t('Two-step verification'), onPress: () => navigation.navigate('AccountSecurity', { section: 'two_factor' }) },
        { icon: 'cloud-download-outline', title: t('Update the app'), subtitle: `${t('Version')} ${version}`, onPress: checking ? undefined : checkVersion },
        { icon: 'trash-outline', title: t('Delete account'), danger: true, onPress: () => navigation.navigate('AccountSecurity', { section: 'delete' }) },
    ];

    return (
        <View style={styles.links}>
            {rows.map((row) => {
                const c = row.danger ? tone.danger : tone.brand;
                return (
                    <Pressable
                        key={row.icon}
                        onPress={row.onPress}
                        accessibilityRole="button"
                        style={({ hovered }) => [styles.link, dir.row, hovered && styles.linkHover, row.danger && hovered && styles.linkDangerHover]}
                    >
                        <View style={[styles.linkIcon, { backgroundColor: c.bg }]}>
                            <Ionicons name={row.icon} size={18} color={c.fg} />
                        </View>
                        <View style={styles.linkBody}>
                            <Text style={[styles.linkTitle, dir.bold, dir.align, row.danger && { color: palette.danger }]} numberOfLines={1}>{row.title}</Text>
                            {!!row.subtitle && <Text style={[styles.linkSub, dir.light, dir.align]} numberOfLines={2}>{row.subtitle}</Text>}
                        </View>
                        <Ionicons name={dir.rtl ? 'chevron-back' : 'chevron-forward'} size={16} color={surface.faint} />
                    </Pressable>
                );
            })}
        </View>
    );
}

export default function Profile() {
    const { t, i18n } = useTranslation();
    const isRTL = langIsRTL(i18n.language);
    const NewStyles = useMemo(
        () => createStyles(i18n.language),
        [i18n.language]
    );
    const dir = useDir();
    const fa = i18n.language === 'fa';
    const navigation = useNavigation();
    const { logoutWithConfirmation, logoutFromAllDevicesWithConfirmation, isLoggingOut } = useLogout();
    const [datePickerModal, setDatePickerModal] = useState(false);
    const [checkingUserType, setCheckingUserType] = useState(true);
    const [userType, setUserType] = useState(null);
    const [pickedImageUri, setPickedImageUri] = useState(null);
    // Get user type from Redux
    const userTypeFromRedux = useSelector(state => state.auth.userType);
    const user = useSelector(state => state.user?.data)
    const token = useSelector(state => state.auth?.token)
    // Profile data states 
    const [profileData, setProfileData] = useState({
        name: '',
        last_name: '',
        phone: '',
        email: '',
        melicode: '',
        mobile_number: '',
        phone_number: '',
        postal_code: '',
        city: '',
        region_id: '',
        home_address: '',
        work_address: '',
        card_number: '',
        sheba_number: ''
    });

    // Password change states
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: ''
    });
    // Password validation errors from API
    const [passwordErrors, setPasswordErrors] = useState({
        currentPassword: '',
        newPassword: ''
    });

    const dispatch = useDispatch()
    // UI states
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingPassword, setIsLoadingPassword] = useState(false);
    const [birthDate, setBirthDate] = useState('');
    const [captcha, setCaptcha] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
    const [captchaInput, setCaptchaInput] = useState('');
    const [autoLoginEnabled, setAutoLoginEnabled] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [birthDateChanged, setBirthDateChanged] = useState(false); 
    const [errorTxt, setErrorTxt] = useState({
        name: '',
        last_name: '',
        email: '',
        region_id: '',
    })
    // Helper function to get full image URL
    const getImageUrl = (path) => {
        if (!path) {
            return null;
        }

        // اگر URI محلی است (file://, blob:, content://)
        if (path.startsWith('file://') || path.startsWith('blob:') || path.startsWith('content://')) {
            return path;
        }

        // اگر URL کامل است (http, https)
        if (path.startsWith('http')) {
            return path;
        }

        // اگر relative path است از سرور
        const fullUrl = `${imageUri}/${path}`;
        return fullUrl;
    };

    // Check user type on mount
    useEffect(() => {
        if (user?.account_type) {
            setUserType(user?.account_type)
        }
    }, [user?.account_type]);


    // Load profile data on component mount
    useEffect(() => {
        if (userType === 'individual' || !userType) {
            loadProfile();
            loadAutoLoginStatus();
            generateCaptcha(); // Generate a fresh captcha on component mount
        }
    }, [userType]);

    // Load auto-login status
    const loadAutoLoginStatus = async () => {
        try {
            const enabled = await AsyncStorage.getItem('autoLoginEnabled');
            setAutoLoginEnabled(enabled === 'true');
        } catch (error) {
            console.log('Error loading auto-login status:', error);
        }
    };

    // Toggle auto-login
    const toggleAutoLogin = async () => {
        try {
            const newStatus = !autoLoginEnabled;
            setAutoLoginEnabled(newStatus);

            if (newStatus) {
                // First check if user has a valid token
                const currentToken = await TokenManager.getToken();
                if (!currentToken) {
                    showToastOrAlert(t('Please log in first to enable auto-login'));
                    setAutoLoginEnabled(false);
                    return;
                }

                await AsyncStorage.setItem('autoLoginEnabled', 'true');
                await AsyncStorage.setItem('rememberLogin', 'true');
                showToastOrAlert(t('Auto-login enabled'));
            } else {
                await AsyncStorage.removeItem('autoLoginEnabled');
                showToastOrAlert(t('Auto-login disabled'));
            }
        } catch (error) {
            console.log('Error toggling auto-login:', error);
            showToastOrAlert(t('Error changing settings'));
        }
    };

    // Pick profile image
    const pickProfileImage = async () => {
        try {
            // Request permission
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                showToastOrAlert(t('Gallery access is required to select a photo'));
                return;
            }

            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedImage = result.assets[0];
                console.log('📷 Selected image URI:', selectedImage.uri);
                console.log('📱 Platform:', Platform.OS);
                setProfileImage(selectedImage.uri);
                setPickedImageUri(selectedImage.uri);
                showToastOrAlert(t('Image selected. To save, click Save Profile Information button'));
            }
        } catch (error) {
            console.log('Error picking image:', error);
            showToastOrAlert(t('Error selecting image'));
        }
    };

    // Load user profile
    const loadProfile = async () => {
        try {
            const response = await userAPI.getProfile();
            if (response.success && response.data?.user) {
                const user = response.data.user;
                setProfileData({
                    name: user.name || '',
                    last_name: user.last_name || '',
                    phone: user.phone || '',
                    email: user.email || '',
                    melicode: user.melicode || '',
                    mobile_number: user.mobile_number || '',
                    phone_number: user.phone_number || '',
                    postal_code: user.postal_code || '',
                    city: user.city || '',
                    region_id: user.region_id || '',
                    home_address: user.home_address || '',
                    work_address: user.work_address || '',
                    card_number: user.card_number || '',
                    sheba_number: user.sheba_number || ''
                });

                // Set birth date if available
                if (user.birth_date) {
                    setBirthDate(user.birth_date);
                }

                // Set profile image if available
                if (user.profile_photo_path) {
                    setProfileImage(user.profile_photo_path);
                    setPickedImageUri(null);
                }
            }
        } catch (error) {
            showToastOrAlert(t('Error loading profile information'));
        }
    };
    const validateForm = () => {
        const errors = {};

        // Phone validation (11 digits starting with 09)
        if (!profileData.name) {
            errors.name = t("Please enter your name.");
        }

        // Password validation
        if (!profileData.last_name) {
            errors.last_name = t("Please enter your last name.");
        }
        if (!profileData.email) {
            errors.email = t('Please enter your Email Address.');
        }


        if (!profileData.region_id) {
            errors.region_id = t('Please select your region.');
        }

        return errors;
    };

    // Update profile data
    const updateProfile = async () => {
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setErrorTxt(errors)
            return;
        } else {

            try {
                setIsLoading(true);

                // بررسی اینکه آیا عکس جدید انتخاب شده
                const hasNewImage = isLocalUri(pickedImageUri);

                if (hasNewImage) {
                    // استفاده از FormData برای آپلود عکس
                    const formData = new FormData();

                    // Laravel نیاز به _method برای PUT با FormData دارد
                    formData.append('_method', 'PUT');

                    // اضافه کردن عکس با نام profile_image
                    if (Platform.OS === 'web') {
                        // برای وب: تبدیل blob به File
                        try {
                            const response = await fetch(profileImage);
                            const blob = await response.blob();
                            const fileName = `profile_${Date.now()}.${blob.type.split('/')[1]}`;
                            const file = new File([blob], fileName, { type: blob.type });
                            formData.append("profile_photo_path", file);
                            console.log('📷 Web: Image converted to File object');
                        } catch (err) {
                            console.error('❌ Error converting image:', err);
                            showToastOrAlert(t('Error processing image'));
                            return;
                        }
                    } else {
                        // برای موبایل: از URI استفاده می‌کنیم
                        let finalUri = profileImage;
                        if (Platform.OS === "android" && !finalUri.startsWith("file://")) {
                            finalUri = "file://" + finalUri;
                        }

                        const fileName = finalUri.split("/").pop();
                        const ext = fileName.split('.').pop();
                        const type = `image/${ext}`;

                        formData.append("profile_photo_path", {
                            uri: finalUri,
                            name: fileName,
                            type,
                        });
                        console.log('📱 Native: Image added to FormData');
                    }

                    // اضافه کردن همه فیلدهای پروفایل (سرور نیاز دارد حداقل یک فیلد داشته باشیم)
                    let addedFields = 0;
                    Object.keys(profileData).forEach(key => {
                        if (key == 'region_id') {
                            if (profileData[key]?.id) {
                                formData.append('region_id', profileData[key]?.id);
                                formData.append('region', profileData[key]?.code);
                            }
                        } else if (key !== 'phone') {
                            const value = (profileData[key] || '').toString().trim();
                            formData.append(key, value);
                            if (value) addedFields++;
                            console.log(`📝 Field ${key}: ${value || '(empty)'}`);
                        }
                    });
                    // اضافه کردن تاریخ تولد (تبدیل - به /)
                    
                    if (birthDate && birthDate.trim() !== '') {
                        // سرور انتظار فرمت 1370/05/15 دارد (با /)
                        const formattedDate = birthDate.trim().replace(/-/g, '/');
                        formData.append('birth_date', formattedDate);
                        addedFields++;
                        console.log(`📝 Field birth_date: ${formattedDate} (original: ${birthDate})`);
                    }


                    const response = await userAPI.updateProfile(formData);

                    if (response.success) {
                        showToastOrAlert(response.message);
                        // رسید آدرس/تلفن ثابت/کد ملی را از همین پروفایل می‌خواند
                        // و نتیجه را کش می‌کند؛ بدون این، رسید تا ری‌لود بعدی
                        // مقدار قدیمی را نشان می‌داد.
                        clearAccountProfileCache();


                        // بروزرسانی state محلی
                        if (response.user) {
                            const user = response.user;


                            // بروزرسانی عکس پروفایل
                            if (user.profile_photo_path) {
                                setProfileImage(user.profile_photo_path);
                                console.log('✅ Profile image updated to:', user.profile_photo_path);
                            } else {
                                console.log('⚠️ No profile_photo_path in response');
                            }

                            setProfileData(prev => ({
                                ...prev,
                                name: user.name || prev.name,
                                last_name: user.last_name || prev.last_name,
                                email: user.email || prev.email,
                                melicode: user.melicode || prev.melicode,
                                mobile_number: user.mobile_number || prev.mobile_number,
                                phone_number: user.phone_number || prev.phone_number,
                                postal_code: user.postal_code || prev.postal_code,
                                city: user.city || prev.city,
                                region_id: user.region_id || prev.region_id,
                                home_address: user.home_address || prev.home_address,
                                work_address: user.work_address || prev.work_address,
                                card_number: user.card_number || prev.card_number,
                                sheba_number: user.sheba_number || prev.sheba_number
                            }));

                            if (user.birth_date) {
                                setBirthDate(user.birth_date);
                            }
                        }

                        if (response.requires_verification) {
                            showToastOrAlert('کد تایید به شماره جدید ارسال شد');
                        }
                    }
                } else {
                    // بدون عکس - فقط JSON
                    const updateData = {};
                    Object.keys(profileData).forEach(key => {
                        if (key == 'region_id') {
                            if (profileData[key]?.id) {
                                updateData['region_id'] = profileData[key]?.id
                                updateData['region'] = profileData[key]?.code
                            }
                        } else if (key !== 'phone' && profileData[key] && profileData[key].trim() !== '') {
                            updateData[key] = profileData[key].trim();
                        }
                    });

                    if (birthDateChanged && birthDate && birthDate.trim() !== '') {
                        // سرور انتظار فرمت 1370/05/15 دارد (با /)
                        updateData.birth_date = birthDate.trim().replace(/-/g, '/');
                    }
                    console.log('====================================');
                    console.log("birthDate:", birthDate, birthDateChanged);
                    console.log('====================================');

                    if (Object.keys(updateData).length === 0) {
                        showToastOrAlert(t('No information to update'));
                        return;
                    }


                    const response = await userAPI.updateProfile(updateData);

                    if (response.success) {
                        showToastOrAlert(response.message);
                        // رسید آدرس/تلفن ثابت/کد ملی را از همین پروفایل می‌خواند
                        // و نتیجه را کش می‌کند؛ بدون این، رسید تا ری‌لود بعدی
                        // مقدار قدیمی را نشان می‌داد.
                        clearAccountProfileCache();

                        setBirthDateChanged(false);

                        if (response.user) {
                            const user = response.user;

                            if (user.profile_photo_path) {
                                setProfileImage(user.profile_photo_path);
                            }

                            setProfileData(prev => ({
                                ...prev,
                                name: user.name || prev.name,
                                last_name: user.last_name || prev.last_name,
                                email: user.email || prev.email,
                                melicode: user.melicode || prev.melicode,
                                mobile_number: user.mobile_number || prev.mobile_number,
                                phone_number: user.phone_number || prev.phone_number,
                                postal_code: user.postal_code || prev.postal_code,
                                city: user.city || prev.city,
                                region_id: user.region_id || prev.region_id,
                                home_address: user.home_address || prev.home_address,
                                work_address: user.work_address || prev.work_address,
                                card_number: user.card_number || prev.card_number,
                                sheba_number: user.sheba_number || prev.sheba_number
                            }));

                            if (user.birth_date) {
                                setBirthDate(user.birth_date);
                            }
                        }

                        if (response.requires_verification) {
                            showToastOrAlert('کد تایید به شماره جدید ارسال شد');
                        }
                    }
                }
            } catch (error) {

                if (error.message === 'Network Error' || !error.response) {
                    showToastOrAlert(t('Error connecting to server. Please check your internet connection'));
                } else if (error.response?.status === 401) {
                    showToastOrAlert(t('Your session has expired. Please log in again'));
                } else if (error.response?.status === 403) {
                    showToastOrAlert(error.response.data.message || 'دسترسی شما محدود شده است');
                } else if (error.response?.status === 422) {
                    const errors = error.response.data.errors;
                    if (errors && typeof errors === 'object') {
                        const firstErrorKey = Object.keys(errors)[0];
                        const firstError = errors[firstErrorKey][0];
                        showToastOrAlert(firstError);
                    } else {
                        showToastOrAlert(error.response.data.message || t('Error validating information'));
                    }
                } else if (error.response?.status === 400) {
                    showToastOrAlert(error.response.data.message || t('Error updating information'));
                } else if (error.response?.status === 413) {
                    showToastOrAlert(t('Image file size exceeds limit (max 5MB)'));
                } else if (error.response?.status >= 500) {
                    showToastOrAlert(t('Server error. Please try again later'));
                } else {
                    showToastOrAlert(error.response?.data?.message || 'خطا در بروزرسانی اطلاعات');
                }
            } finally {
                setIsLoading(false);
                dispatch(fetchUser(token))
            }
        }
    };
    // Change password
    const changePassword = async () => {
        try {
            // reset previous field errors
            setPasswordErrors({ currentPassword: '', newPassword: '' });
            // Validate captcha
            if (captchaInput !== captcha) {
                showToastOrAlert(t('Security code is incorrect'));
                generateCaptcha();
                setCaptchaInput('');
                return;
            }

            if (!passwordData.currentPassword || !passwordData.newPassword) {
                showToastOrAlert(t('Please enter current and new password'));
                return;
            }

            if (passwordData.newPassword.length < 8) {
                showToastOrAlert(t('New password must be at least 8 characters'));
                return;
            }

            setIsLoadingPassword(true);

            const response = await userAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            if (response.success) {
                showToastOrAlert(response.message);
                // Clear password fields
                setPasswordData({ currentPassword: '', newPassword: '' });
                setCaptchaInput('');
                generateCaptcha();
            }
        } catch (error) {
            console.log(error)

            // Handle validation errors and show inline messages
            if (error.response?.status === 400) {
                showToastOrAlert(t('Current password is incorrect'));
            } else if (error.response?.status === 422) {
                const errors = error.response.data.errors || {};
                // Map backend keys to our fields
                const newErrors = { currentPassword: '', newPassword: '' };
                if (errors.current_password) {
                    newErrors.currentPassword = errors.current_password[0];
                }
                // some backends return 'password', some 'new_password'
                if (errors.password) {
                    newErrors.newPassword = errors.password[0];
                } else if (errors.new_password) {
                    newErrors.newPassword = errors.new_password[0];
                }

                // If we have any field errors, show them inline; otherwise show generic
                if (newErrors.currentPassword || newErrors.newPassword) {
                    setPasswordErrors(newErrors);
                } else {
                    // fallback: show first validation message if available
                    const firstErr = Object.values(errors)[0];
                    if (Array.isArray(firstErr) && firstErr.length > 0) showToastOrAlert(firstErr[0]);
                    else showToastOrAlert('خطا در اعتبارسنجی اطلاعات');
                }
            } else {
                showToastOrAlert(t('Error changing password'));
            }

            generateCaptcha();
            setCaptchaInput('');
        } finally {
            setIsLoadingPassword(false);
        }
    };

    const generateCaptcha = () => {
        const n = Math.floor(1000 + Math.random() * 9000).toString();
        setCaptcha(n);
    };

    // Show loading while checking user type
    if (!user?.account_type) {
        return <Loader />;
    }

    // Show OrganizationProfile for organization users
    if (userType !== 'individual') { 
        // این مسیر چیدمان dashboard دارد؛ صفحه‌ی سازمان هنوز همان صفحه‌ی موبایل
        // است، پس مثل بقیه‌ی صفحه‌های موبایلی در کارت روشن (paper) می‌نشیند.
        return (
            <View style={styles.orgStage}>
                <View dataSet={{ loopPaper: '' }} style={styles.orgFrame}>
                    <OrganizationProfile />
                </View>
            </View>
        );
    }

    const name = [profileData.name, profileData.last_name].filter(Boolean).join(' ');
    const initial = (profileData.name || '').trim().charAt(0);
    const copy = fa
        ? {
            subtitle: 'اطلاعات حساب، آدرس‌ها و تنظیمات امنیتی‌تان را از اینجا مدیریت کنید. این اطلاعات روی سفارش‌ها و رسیدها نمایش داده می‌شود.',
            personal: 'اطلاعات شخصی', personalHint: 'نام و راه‌های تماس با شما',
            address: 'منطقه و آدرس‌ها', addressHint: 'منطقه برای ثبت سفارش الزامی است',
            bank: 'اطلاعات بانکی', bankHint: 'برای بازگشت وجه (اختیاری)',
            password: 'تغییر رمز عبور', passwordHint: 'رمز فعلی و کد امنیتی را وارد کنید',
            settings: 'تنظیمات حساب', individual: 'کاربر حقیقی', userCode: 'کد کاربری',
            photo: 'تغییر عکس', readonly: 'شماره‌ی موبایل قابل تغییر نیست',
            saveHint: 'تغییرات اطلاعات شخصی، آدرس‌ها و عکس پروفایل با این دکمه ذخیره می‌شوند.',
            secure: 'حساب امن',
        }
        : {
            subtitle: 'Manage your details, addresses and security here. They appear on your orders and receipts.',
            personal: 'Personal details', personalHint: 'Your name and how to reach you',
            address: 'District & addresses', addressHint: 'A district is required to place orders',
            bank: 'Bank details', bankHint: 'For refunds (optional)',
            password: 'Change password', passwordHint: 'Enter your current password and the security code',
            settings: 'Account settings', individual: 'Individual user', userCode: 'User code',
            photo: 'Change photo', readonly: 'Your mobile number can’t be changed',
            saveHint: 'Personal details, addresses and the profile photo are saved with this button.',
            secure: 'Secure account',
        };

    return (
        <View style={styles.screen}>
            <ScreenHeaders title={t("My Profile")} />
            <FormPage
                hero={{
                    icon: 'person-circle-outline',
                    title: t("My Profile"),
                    subtitle: copy.subtitle,
                    badges: [
                        { icon: 'person-outline', label: copy.individual },
                        { icon: 'shield-checkmark-outline', label: copy.secure },
                    ],
                }}
                actionsHint={copy.saveHint}
                actions={
                    <DButton
                        title={isLoading ? t('Saving...') : t('Save Profile Information')}
                        icon="checkmark-circle-outline"
                        variant="gold"
                        size="lg"
                        onPress={updateProfile}
                        disabled={isLoading}
                        loading={isLoading}
                    />
                }
                aside={
                    <>
                        <View style={styles.identity}>
                            <View style={styles.stars} pointerEvents="none" />
                            <Pressable onPress={pickProfileImage} accessibilityRole="button" accessibilityLabel={copy.photo} style={styles.avatarRing}>
                                {({ hovered }) => (
                                    <>
                                        {profileImage ? (
                                            <Image source={{ uri: getImageUrl(profileImage) }} style={styles.avatar} />
                                        ) : (
                                            <View style={[styles.avatar, styles.avatarEmpty]}>
                                                {initial ? (
                                                    <Text style={[styles.avatarInitial, dir.bold]}>{initial}</Text>
                                                ) : (
                                                    <Ionicons name="person" size={46} color={palette.navy700} />
                                                )}
                                            </View>
                                        )}
                                        <View style={[styles.avatarOverlay, hovered && styles.avatarOverlayOn]}>
                                            <Ionicons name="camera" size={22} color="#ffffff" />
                                            <Text style={[styles.avatarOverlayText, dir.bold]}>{copy.photo}</Text>
                                        </View>
                                        <View style={styles.cameraBadge}>
                                            <Ionicons name="camera" size={14} color={palette.navy900} />
                                        </View>
                                    </>
                                )}
                            </Pressable>
                            <Text style={[styles.identityName, dir.bold]} numberOfLines={1}>{name || t('My Profile')}</Text>
                            <Pill label={copy.individual} kind="gold" icon="person" size="sm" style={styles.center} />
                            {!!user?.code && (
                                <View style={styles.codeBox}>
                                    <Text style={[styles.codeLabel, dir.light]}>{copy.userCode}</Text>
                                    <Text style={[styles.code, dir.bold]} selectable>{user.code}</Text>
                                </View>
                            )}
                            {!!profileData.phone && (
                                <View style={[styles.identityRow, dir.row]}>
                                    <Ionicons name="call-outline" size={15} color={onDark.muted} />
                                    <Text style={[styles.identityText, dir.light]}>{profileData.phone}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.settings}>
                            <Text style={[styles.settingsTitle, dir.bold, dir.align]}>{copy.settings}</Text>
                            <Toggle
                                icon="flash-outline"
                                value={autoLoginEnabled}
                                onChange={() => toggleAutoLogin()}
                                label={t('Automatic login (without password)')}
                            />
                            <AccountLinks navigation={navigation} />
                        </View>

                        <DButton
                            title={isLoggingOut ? t('Logging out...') : t('Log Out')}
                            icon="log-out-outline"
                            variant="danger"
                            size="lg"
                            block
                            onPress={logoutWithConfirmation}
                            disabled={isLoggingOut}
                        />
                    </>
                }
            >
                <FormSection index={0} icon="person-outline" title={copy.personal} subtitle={copy.personalHint}>
                    <FieldGrid>
                        <Field label={t('First Name')} error={errorTxt?.name && t(errorTxt?.name)}>
                            <TextField icon="person-outline" invalid={!!errorTxt?.name} placeholder={t('First Name')} value={profileData.name} onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))} />
                        </Field>
                        <Field label={t('Last Name')} error={errorTxt?.last_name && t(errorTxt?.last_name)}>
                            <TextField icon="people-outline" invalid={!!errorTxt?.last_name} placeholder={t('Last Name')} value={profileData.last_name} onChangeText={(text) => setProfileData(prev => ({ ...prev, last_name: text }))} />
                        </Field>
                        <Field label={t('Mobile Number')} hint={copy.readonly}>
                            <TextField icon="phone-portrait-outline" value={profileData.phone} editable={false} selectTextOnFocus={false} placeholder={t('Mobile Number')} />
                        </Field>
                        <Field label={t('Birth Date')}>
                            <SelectField value={birthDate} placeholder={t('Birth Date')} onPress={() => setDatePickerModal(true)} />
                        </Field>
                        <Field label={t('Email Address')} error={errorTxt?.email && t(errorTxt?.email)}>
                            <TextField icon="mail-outline" invalid={!!errorTxt?.email} placeholder={t('Email Address')} keyboardType="email-address" value={profileData.email} onChangeText={(text) => setProfileData(prev => ({ ...prev, email: text }))} />
                        </Field>
                        <Field label={t('Second Mobile Number')}>
                            <TextField icon="phone-portrait-outline" placeholder={t('Second Mobile Number')} keyboardType="number-pad" value={profileData.mobile_number} onChangeText={(text) => setProfileData(prev => ({ ...prev, mobile_number: text }))} />
                        </Field>
                        <Field label={t('Landline Number')}>
                            <TextField icon="call-outline" unit="021" placeholder={t('Landline Number')} keyboardType="number-pad" value={profileData.phone_number} onChangeText={(text) => setProfileData(prev => ({ ...prev, phone_number: text }))} />
                        </Field>
                        <Field label={t('Postal Code')}>
                            <TextField icon="mail-unread-outline" placeholder={t('Postal Code')} keyboardType="number-pad" value={profileData.postal_code} onChangeText={(text) => setProfileData(prev => ({ ...prev, postal_code: text }))} />
                        </Field>
                    </FieldGrid>
                </FormSection>

                <FormSection index={1} icon="location-outline" title={copy.address} subtitle={copy.addressHint}>
                    <FieldGrid>
                        <Field label={t('District')} required full error={errorTxt?.region_id && t(errorTxt?.region_id)}>
                            <LocationPicker
                                selectedProvince={null}
                                selectedCity={null}
                                selectedRegion={profileData.region_id}
                                onProvinceChange={() => {}}
                                onCityChange={() => {}}
                                onRegionChange={(region) => {
                                    setProfileData(prev => ({ ...prev, region_id: region }))
                                }}
                                errors={{}}
                                required={true}
                            />
                        </Field>
                        <Field label={t('Home Address')}>
                            <TextField icon="home-outline" multiline rows={3} placeholder={t('Home Address')} value={profileData.home_address} onChangeText={(text) => setProfileData(prev => ({ ...prev, home_address: text }))} />
                        </Field>
                        <Field label={t('Work Address')}>
                            <TextField icon="business-outline" multiline rows={3} placeholder={t('Work Address')} value={profileData.work_address} onChangeText={(text) => setProfileData(prev => ({ ...prev, work_address: text }))} />
                        </Field>
                    </FieldGrid>
                </FormSection>

                <FormSection index={2} icon="card-outline" title={copy.bank} subtitle={copy.bankHint}>
                    <FieldGrid>
                        <Field label={t('User Card Number')}>
                            <TextField icon="card-outline" placeholder={t('User Card Number (optional)')} keyboardType="number-pad" value={profileData.card_number} onChangeText={(text) => setProfileData(prev => ({ ...prev, card_number: text }))} />
                        </Field>
                        <Field label={t('User SHEBA Number')}>
                            <TextField icon="business-outline" unit="IR" placeholder={t('User SHEBA Number (optional)')} value={profileData.sheba_number} onChangeText={(text) => setProfileData(prev => ({ ...prev, sheba_number: text }))} />
                        </Field>
                    </FieldGrid>
                </FormSection>

                <FormSection
                    index={3}
                    icon="key-outline"
                    title={copy.password}
                    subtitle={copy.passwordHint}
                    right={
                        <DButton
                            title={isLoadingPassword ? t('Changing...') : t('Change Password')}
                            icon="key"
                            variant="outline"
                            onPress={changePassword}
                            disabled={isLoadingPassword}
                            loading={isLoadingPassword}
                        />
                    }
                >
                    <FieldGrid>
                        <Field label={t('Current Password')} error={passwordErrors.currentPassword}>
                            <TextField
                                icon="lock-closed-outline"
                                invalid={!!passwordErrors.currentPassword}
                                placeholder={t('Current Password')}
                                secureTextEntry
                                value={passwordData.currentPassword}
                                onChangeText={(text) => {
                                    if (passwordErrors.currentPassword) setPasswordErrors(prev => ({ ...prev, currentPassword: '' }));
                                    setPasswordData(prev => ({ ...prev, currentPassword: text }));
                                }}
                            />
                        </Field>
                        <Field label={t('New Password')} error={passwordErrors.newPassword}>
                            <TextField
                                icon="key-outline"
                                invalid={!!passwordErrors.newPassword}
                                placeholder={t('New Password')}
                                secureTextEntry
                                value={passwordData.newPassword}
                                onChangeText={(text) => {
                                    if (passwordErrors.newPassword) setPasswordErrors(prev => ({ ...prev, newPassword: '' }));
                                    setPasswordData(prev => ({ ...prev, newPassword: text }));
                                }}
                            />
                        </Field>
                        <Field label={t('Security Code')} full>
                            <View style={[styles.captchaRow, dir.row]}>
                                <View style={styles.flex}>
                                    <TextField icon="shield-checkmark-outline" placeholder={t('Security Code')} value={captchaInput} onChangeText={setCaptchaInput} />
                                </View>
                                <Pressable onPress={generateCaptcha} accessibilityRole="button" style={styles.captcha}>
                                    <Text style={[styles.captchaText, dir.bold]}>{captcha}</Text>
                                </Pressable>
                                <IconButton icon="refresh" label={t('Security Code')} onPress={generateCaptcha} color={palette.brandBright} size={46} />
                            </View>
                        </Field>
                    </FieldGrid>
                </FormSection>
            </FormPage>

            <DatePickerModal
                birthDate={birthDate}
                setBirthDate={setBirthDate}
                setDatePickerModal={setDatePickerModal}
                datePickerModal={datePickerModal}
                onDateChange={(date) => {
                    console.log('📅 Birth date changed to:', date);
                    setBirthDateChanged(true);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: 'transparent' },
    flex: { flex: 1, minWidth: 0 },
    center: { alignSelf: 'center' },
    orgStage: { flex: 1, paddingHorizontal: contentGutter, paddingBottom: 24 },
    orgFrame: {
        flex: 1,
        width: '100%',
        maxWidth: contentMaxWidth,
        alignSelf: 'center',
        borderRadius: radii.xl,
        overflow: 'hidden',
        backgroundColor: surface.card,
        boxShadow: elevation.raised,
        borderWidth: 1,
        borderColor: surface.border,
    },

    identity: {
        alignItems: 'center',
        gap: 10,
        padding: 26,
        borderRadius: radii.xl,
        overflow: 'hidden',
        backgroundImage: gradients.hero,
        boxShadow: elevation.floating,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    stars: { ...StyleSheet.absoluteFillObject, backgroundImage: gradients.stars },
    avatarRing: {
        width: 124,
        height: 124,
        borderRadius: 62,
        padding: 4,
        backgroundImage: gradients.gold,
        boxShadow: '0 0 40px rgba(255, 215, 0, 0.28)',
        cursor: 'pointer',
        marginBottom: 6,
    },
    avatar: { width: '100%', height: '100%', borderRadius: 58, backgroundColor: '#ffffff' },
    avatarEmpty: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff6cc' },
    avatarInitial: { fontSize: 46, color: palette.navy800 },
    avatarOverlay: {
        position: 'absolute',
        top: 4,
        left: 4,
        right: 4,
        bottom: 4,
        borderRadius: 58,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        backgroundColor: 'rgba(4, 15, 31, 0.6)',
        opacity: 0,
        transitionProperty: 'opacity',
        transitionDuration: motion.base,
    },
    avatarOverlayOn: { opacity: 1 },
    avatarOverlayText: { color: '#ffffff', fontSize: 11.5 },
    cameraBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: gradients.gold,
        borderWidth: 3,
        borderColor: palette.navy850,
    },
    identityName: { color: onDark.text, fontSize: 20, textAlign: 'center' },
    codeBox: {
        alignItems: 'center',
        marginTop: 6,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: radii.md,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.25)',
    },
    codeLabel: { color: onDark.muted, fontSize: 11 },
    code: { color: palette.gold, fontSize: 18, letterSpacing: 2 },
    identityRow: { alignItems: 'center', gap: 6 },
    identityText: { color: onDark.soft, fontSize: 13 },

    settings: {
        gap: 12,
        padding: 18,
        borderRadius: radii.lg,
        backgroundColor: surface.card,
        borderWidth: 1,
        borderColor: surface.border,
        boxShadow: elevation.card,
    },
    settingsTitle: { fontSize: 14.5, color: surface.title },

    links: { gap: 4, marginHorizontal: -8 },
    link: {
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: radii.md,
        cursor: 'pointer',
        transitionProperty: 'background-color',
        transitionDuration: motion.fast,
    },
    linkHover: { backgroundColor: surface.hover },
    linkDangerHover: { backgroundColor: tone.danger.bg },
    linkIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    linkBody: { flex: 1, gap: 2 },
    linkTitle: { fontSize: 13.5, color: surface.title },
    linkSub: { fontSize: 12, color: surface.muted, lineHeight: 19 },

    captchaRow: { alignItems: 'center', gap: 10 },
    captcha: {
        height: 48,
        minWidth: 96,
        paddingHorizontal: 14,
        borderRadius: radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: surface.sunken,
        backgroundImage: 'repeating-linear-gradient(135deg, rgba(127,150,190,0.12) 0px, rgba(127,150,190,0.12) 4px, transparent 4px, transparent 8px)',
        borderWidth: 1,
        borderColor: surface.border,
        cursor: 'pointer',
    },
    captchaText: { fontSize: 19, letterSpacing: 5, color: surface.brandText, fontStyle: 'italic' },
});
