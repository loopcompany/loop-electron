/**
 * DESKTOP OVERRIDE of loop-customer-mobile/screens/account/Profile.js
 *
 * The individual user's account page as a desktop settings page: an identity
 * banner (photo, name, contact, user code, profile-completion ring), then a
 * tab list beside one focused panel — personal, district & addresses, bank
 * (with a card preview), security (password with a strength hint, two-step)
 * and settings (theme, auto-login, update, danger zone). The side column also
 * lists what is missing from the profile and holds sign-out. A failed save
 * opens the tab of the first invalid field. On a phone it is one long column
 * of inputs. The layout pieces are @desktop/ProfileKit, shared with the
 * OrganizationProfile override (organisation accounts land there).
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
import { clearAccountProfileCache } from '@services/receipt/receiptProfile';

import { DButton, IconButton, formatNumber, useDir } from '@desktop/ui';
import { Field, FieldGrid, SelectField, TextField, Toggle } from '@desktop/FormKit';
import {
    ChecklistCard,
    DangerZone,
    LinkRows,
    PanelGroup,
    PanelNote,
    ProfileBanner,
    ProfileLayout,
    ProfileNav,
    ProfilePanel,
    SaveBar,
    SignOutButton,
    StrengthMeter,
    ThemeSwitch,
    useAccountRows,
} from '@desktop/ProfileKit';
import { elevation, gradients, onDark, palette, radii, surface } from '@desktop/desktopTheme';

const groupCard = (value) =>
    (value || '').replace(/\D/g, '').slice(0, 16).padEnd(16, '•').replace(/(.{4})(?=.)/g, '$1 ');

// فیلدهایی که validateForm خطا می‌گیرد → تبی که آن فیلد در آن است
const ERROR_TABS = [['name', 'personal'], ['last_name', 'personal'], ['email', 'personal'], ['region_id', 'address']];


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

    // دسکتاپ: تب فعال؛ اگر ذخیره به خاطر فیلدی در تب دیگر رد شد، همان تب باز می‌شود
    const [tab, setTab] = useState('personal');
    const accountRows = useAccountRows(navigation);
    useEffect(() => {
        const failed = ERROR_TABS.find(([key]) => errorTxt?.[key]);
        if (failed) setTab(failed[1]);
    }, [errorTxt]);

    // Show loading while checking user type
    if (!user?.account_type) {
        return <Loader />;
    }

    // Show OrganizationProfile for organization users (its own desktop override)
    if (userType !== 'individual') {
        return <OrganizationProfile />;
    }

    const name = [profileData.name, profileData.last_name].filter(Boolean).join(' ');
    const initial = (profileData.name || '').trim().charAt(0);
    const copy = fa
        ? {
            individual: 'کاربر حقیقی', userCode: 'کد کاربری', member: 'حساب کاربری لوپ',
            readonly: 'شماره‌ی موبایل قابل تغییر نیست',
            completion: 'تکمیل پروفایل', complete: 'پروفایل شما کامل است', left: (n) => `${formatNumber(n, 'fa')} مورد باقی مانده`,
            completeBadge: 'پروفایل کامل',
            todo: 'برای تکمیل پروفایل', todoDone: 'همه‌ی اطلاعات اصلی ثبت شده است. سفارش‌ها و رسیدها با همین اطلاعات صادر می‌شوند.',
            items: { photo: 'عکس پروفایل', name: 'نام و نام خانوادگی', email: 'ایمیل', birth: 'تاریخ تولد', district: 'منطقه', address: 'آدرس منزل یا محل کار' },
            tabs: {
                personal: ['اطلاعات شخصی', 'نام، تماس و تاریخ تولد'],
                address: ['منطقه و آدرس‌ها', 'برای ثبت سفارش الزامی است'],
                bank: ['اطلاعات بانکی', 'برای بازگشت وجه'],
                security: ['امنیت و رمز عبور', 'رمز عبور و تأیید دومرحله‌ای'],
                settings: ['تنظیمات حساب', 'ظاهر، ورود خودکار، نسخه'],
            },
            contact: 'راه‌های تماس', contactHint: 'برای هماهنگی سفارش‌ها با این شماره‌ها تماس گرفته می‌شود',
            identity: 'هویت', identityHint: 'همان‌طور که روی رسیدها نوشته می‌شود',
            districtHint: 'کارشناس بر اساس منطقه‌ی شما اعزام می‌شود',
            addresses: 'آدرس‌ها', addressesHint: 'آدرس منزل و محل کار برای انتخاب سریع هنگام سفارش',
            bankIntro: 'این اطلاعات اختیاری است و فقط برای بازگشت وجه به حساب شما استفاده می‌شود.',
            cardHolder: 'دارنده‌ی کارت',
            password: 'تغییر رمز عبور', passwordHint: 'رمز فعلی، رمز جدید و کد امنیتی را وارد کنید',
            passwordRule: 'حداقل ۸ کاراکتر؛ ترکیب حروف بزرگ و کوچک، عدد و نماد امن‌تر است.',
            protection: 'محافظت از حساب', protectionHint: 'تأیید دومرحله‌ای، دستگاه‌ها و نشست‌های فعال',
            appearance: 'ظاهر برنامه', appearanceHint: 'پوسته‌ی روشن، تیره یا هماهنگ با ویندوز',
            login: 'ورود', loginHint: 'روی این دستگاه بدون رمز وارد شوید',
            app: 'برنامه', appHint: 'نسخه و به‌روزرسانی',
            danger: 'ناحیه‌ی حساس', dangerHint: 'این کارها قابل بازگشت نیستند',
            logoutAll: 'خروج از همه‌ی دستگاه‌ها',
            save: 'ذخیره‌ی تغییرات', saveHint: 'تغییرات اطلاعات شخصی، آدرس‌ها، اطلاعات بانکی و عکس با این دکمه ذخیره می‌شوند.',
        }
        : {
            individual: 'Individual user', userCode: 'User code', member: 'Loop account',
            readonly: 'Your mobile number can’t be changed',
            completion: 'Profile completion', complete: 'Your profile is complete', left: (n) => `${n} item${n === 1 ? '' : 's'} left`,
            completeBadge: 'Complete profile',
            todo: 'Finish your profile', todoDone: 'All the main details are in. Orders and receipts use them.',
            items: { photo: 'Profile photo', name: 'Full name', email: 'Email', birth: 'Birth date', district: 'District', address: 'Home or work address' },
            tabs: {
                personal: ['Personal details', 'Name, contact, birth date'],
                address: ['District & addresses', 'Required to place orders'],
                bank: ['Bank details', 'For refunds'],
                security: ['Security & password', 'Password and two-step'],
                settings: ['Account settings', 'Appearance, auto-login, version'],
            },
            contact: 'Contact', contactHint: 'We call these numbers to arrange your orders',
            identity: 'Identity', identityHint: 'As it appears on your receipts',
            districtHint: 'Experts are dispatched by your district',
            addresses: 'Addresses', addressesHint: 'Home and work, to pick quickly when ordering',
            bankIntro: 'Optional — only used to refund money to your account.',
            cardHolder: 'Card holder',
            password: 'Change password', passwordHint: 'Enter your current password, a new one and the security code',
            passwordRule: 'At least 8 characters; mixing cases, digits and symbols is safer.',
            protection: 'Account protection', protectionHint: 'Two-step verification, devices and sessions',
            appearance: 'Appearance', appearanceHint: 'Light, dark or follow Windows',
            login: 'Sign-in', loginHint: 'Sign in on this device without a password',
            app: 'App', appHint: 'Version and updates',
            danger: 'Danger zone', dangerHint: 'These can’t be undone',
            logoutAll: 'Log out of all devices',
            save: 'Save changes', saveHint: 'Personal details, addresses, bank details and the photo are saved with this button.',
        };

    // پیشرفت پروفایل: فقط اطلاعاتی که روی سفارش و رسید اثر دارند
    const checklist = [
        { key: 'photo', done: !!profileImage, onPress: pickProfileImage },
        { key: 'name', done: !!(profileData.name && profileData.last_name), tab: 'personal' },
        { key: 'email', done: !!profileData.email, tab: 'personal' },
        { key: 'birth', done: !!birthDate, tab: 'personal' },
        { key: 'district', done: !!profileData.region_id, tab: 'address' },
        { key: 'address', done: !!(profileData.home_address || profileData.work_address), tab: 'address' },
    ];
    const percent = Math.round((checklist.filter((item) => item.done).length / checklist.length) * 100);
    const missing = checklist.filter((item) => !item.done);

    const tabIcons = { personal: 'person-outline', address: 'location-outline', bank: 'card-outline', security: 'shield-checkmark-outline', settings: 'settings-outline' };
    const tabs = [
        { key: 'personal', error: !!(errorTxt?.name || errorTxt?.last_name || errorTxt?.email), done: checklist.slice(1, 4).every((i) => i.done) },
        { key: 'address', error: !!errorTxt?.region_id, done: checklist.slice(4).every((i) => i.done) },
        { key: 'bank', done: !!(profileData.card_number || profileData.sheba_number) },
        { key: 'security' },
        { key: 'settings' },
    ].map((item) => ({ ...item, icon: tabIcons[item.key], title: copy.tabs[item.key][0], hint: copy.tabs[item.key][1] }));
    const active = tabs.find((item) => item.key === tab) || tabs[0];
    const editable = ['personal', 'address', 'bank'].includes(active.key);

    const setField = (key) => (text) => {
        if (errorTxt?.[key]) setErrorTxt(prev => ({ ...prev, [key]: '' }));
        setProfileData(prev => ({ ...prev, [key]: text }));
    };

    return (
        <View style={styles.screen}>
            <ScreenHeaders title={t("My Profile")} />
            <ProfileLayout
                banner={
                    <ProfileBanner
                        image={getImageUrl(profileImage)}
                        initial={initial}
                        onPickImage={pickProfileImage}
                        kicker={copy.member}
                        name={name || t('My Profile')}
                        pills={[
                            { label: copy.individual, icon: 'person' },
                            ...(percent === 100 ? [{ label: copy.completeBadge, kind: 'success', icon: 'checkmark-circle' }] : []),
                        ]}
                        meta={[
                            { icon: 'call-outline', text: profileData.phone },
                            { icon: 'mail-outline', text: profileData.email },
                        ]}
                        code={{ label: copy.userCode, value: user?.code }}
                        progress={{ percent, title: copy.completion, hint: missing.length ? copy.left(missing.length) : copy.complete }}
                    />
                }
                side={
                    <>
                        <ProfileNav tabs={tabs} active={active.key} onChange={setTab} />
                        <ChecklistCard
                            title={copy.todo}
                            percent={percent}
                            doneText={copy.todoDone}
                            items={missing.map((item) => ({ key: item.key, label: copy.items[item.key], onPress: item.onPress || (() => setTab(item.tab)) }))}
                        />
                        <SignOutButton title={isLoggingOut ? t('Logging out...') : t('Log Out')} onPress={logoutWithConfirmation} disabled={isLoggingOut} />
                    </>
                }
            >
                <ProfilePanel
                    key={active.key}
                    icon={active.icon}
                    title={active.title}
                    hint={active.hint}
                    footer={
                        editable && (
                            <SaveBar hint={copy.saveHint}>
                                <DButton
                                    title={isLoading ? t('Saving...') : copy.save}
                                    icon="checkmark-circle-outline"
                                    variant="gold"
                                    size="lg"
                                    onPress={updateProfile}
                                    disabled={isLoading}
                                    loading={isLoading}
                                />
                            </SaveBar>
                        )
                    }
                >
                    {active.key === 'personal' && (
                        <>
                            <PanelGroup title={copy.identity} hint={copy.identityHint} icon="id-card-outline">
                                <FieldGrid>
                                    <Field label={t('First Name')} required error={errorTxt?.name && t(errorTxt?.name)}>
                                        <TextField icon="person-outline" invalid={!!errorTxt?.name} placeholder={t('First Name')} value={profileData.name} onChangeText={setField('name')} />
                                    </Field>
                                    <Field label={t('Last Name')} required error={errorTxt?.last_name && t(errorTxt?.last_name)}>
                                        <TextField icon="people-outline" invalid={!!errorTxt?.last_name} placeholder={t('Last Name')} value={profileData.last_name} onChangeText={setField('last_name')} />
                                    </Field>
                                    <Field label={t('Birth Date')}>
                                        <SelectField value={birthDate} placeholder={t('Birth Date')} onPress={() => setDatePickerModal(true)} />
                                    </Field>
                                    <Field label={t('Email Address')} required error={errorTxt?.email && t(errorTxt?.email)}>
                                        <TextField icon="mail-outline" invalid={!!errorTxt?.email} placeholder={t('Email Address')} keyboardType="email-address" value={profileData.email} onChangeText={setField('email')} />
                                    </Field>
                                </FieldGrid>
                            </PanelGroup>
                            <PanelGroup title={copy.contact} hint={copy.contactHint} icon="call-outline">
                                <FieldGrid>
                                    <Field label={t('Mobile Number')} hint={copy.readonly}>
                                        <TextField icon="lock-closed-outline" value={profileData.phone} editable={false} selectTextOnFocus={false} placeholder={t('Mobile Number')} />
                                    </Field>
                                    <Field label={t('Second Mobile Number')}>
                                        <TextField icon="phone-portrait-outline" placeholder={t('Second Mobile Number')} keyboardType="number-pad" value={profileData.mobile_number} onChangeText={setField('mobile_number')} />
                                    </Field>
                                    <Field label={t('Landline Number')}>
                                        <TextField icon="call-outline" unit="021" placeholder={t('Landline Number')} keyboardType="number-pad" value={profileData.phone_number} onChangeText={setField('phone_number')} />
                                    </Field>
                                    <Field label={t('Postal Code')}>
                                        <TextField icon="mail-unread-outline" placeholder={t('Postal Code')} keyboardType="number-pad" value={profileData.postal_code} onChangeText={setField('postal_code')} />
                                    </Field>
                                </FieldGrid>
                            </PanelGroup>
                        </>
                    )}

                    {active.key === 'address' && (
                        <>
                            <PanelGroup title={t('District')} hint={copy.districtHint} icon="map-outline">
                                <Field required error={errorTxt?.region_id && t(errorTxt?.region_id)}>
                                    <LocationPicker
                                        selectedProvince={null}
                                        selectedCity={null}
                                        selectedRegion={profileData.region_id}
                                        onProvinceChange={() => {}}
                                        onCityChange={() => {}}
                                        onRegionChange={(region) => {
                                            setField('region_id')(region);
                                        }}
                                        errors={{}}
                                        required={true}
                                    />
                                </Field>
                            </PanelGroup>
                            <PanelGroup title={copy.addresses} hint={copy.addressesHint} icon="home-outline">
                                <FieldGrid>
                                    <Field label={t('Home Address')}>
                                        <TextField icon="home-outline" multiline rows={4} placeholder={t('Home Address')} value={profileData.home_address} onChangeText={setField('home_address')} />
                                    </Field>
                                    <Field label={t('Work Address')}>
                                        <TextField icon="business-outline" multiline rows={4} placeholder={t('Work Address')} value={profileData.work_address} onChangeText={setField('work_address')} />
                                    </Field>
                                </FieldGrid>
                            </PanelGroup>
                        </>
                    )}

                    {active.key === 'bank' && (
                        <View style={[styles.bankRow, dir.row]}>
                            <View style={styles.bankCard}>
                                <View style={styles.stars} pointerEvents="none" />
                                <View style={[styles.bankTop, dir.row]}>
                                    <View style={styles.chip} />
                                    <Ionicons name="wifi" size={20} color={onDark.muted} style={styles.contactless} />
                                </View>
                                <Text style={[styles.bankNumber, dir.bold]}>{groupCard(profileData.card_number)}</Text>
                                <View style={[styles.bankBottom, dir.row]}>
                                    <View style={styles.flex}>
                                        <Text style={[styles.bankLabel, dir.light, dir.align]}>{copy.cardHolder}</Text>
                                        <Text style={[styles.bankName, dir.bold, dir.align]} numberOfLines={1}>{name || '—'}</Text>
                                    </View>
                                    <Text style={[styles.bankLogo, dir.bold]}>LOOP</Text>
                                </View>
                            </View>
                            <View style={[styles.flex, styles.bankFields]}>
                                <PanelNote icon="lock-closed-outline">{copy.bankIntro}</PanelNote>
                                <Field label={t('User Card Number')}>
                                    <TextField icon="card-outline" placeholder={t('User Card Number (optional)')} keyboardType="number-pad" value={profileData.card_number} onChangeText={setField('card_number')} />
                                </Field>
                                <Field label={t('User SHEBA Number')}>
                                    <TextField icon="business-outline" unit="IR" placeholder={t('User SHEBA Number (optional)')} value={profileData.sheba_number} onChangeText={setField('sheba_number')} />
                                </Field>
                            </View>
                        </View>
                    )}

                    {active.key === 'security' && (
                        <>
                            <PanelGroup title={copy.password} hint={copy.passwordHint} icon="key-outline">
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
                                        <StrengthMeter value={passwordData.newPassword} />
                                    </Field>
                                    <Field label={t('Security Code')} full hint={copy.passwordRule}>
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
                                <View style={[styles.groupActions, dir.row]}>
                                    <DButton
                                        title={isLoadingPassword ? t('Changing...') : t('Change Password')}
                                        icon="key"
                                        variant="primary"
                                        onPress={changePassword}
                                        disabled={isLoadingPassword}
                                        loading={isLoadingPassword}
                                    />
                                </View>
                            </PanelGroup>
                            <PanelGroup title={copy.protection} hint={copy.protectionHint} icon="finger-print-outline">
                                <LinkRows rows={[accountRows.security, accountRows.twoFactor]} />
                            </PanelGroup>
                        </>
                    )}

                    {active.key === 'settings' && (
                        <>
                            <PanelGroup title={copy.appearance} hint={copy.appearanceHint} icon="color-palette-outline">
                                <ThemeSwitch />
                            </PanelGroup>
                            <PanelGroup title={copy.login} hint={copy.loginHint} icon="flash-outline">
                                <Toggle
                                    icon="flash-outline"
                                    value={autoLoginEnabled}
                                    onChange={() => toggleAutoLogin()}
                                    label={t('Automatic login (without password)')}
                                />
                            </PanelGroup>
                            <PanelGroup title={copy.app} hint={copy.appHint} icon="apps-outline">
                                <LinkRows rows={[accountRows.update]} />
                            </PanelGroup>
                            <DangerZone>
                                <PanelGroup title={copy.danger} hint={copy.dangerHint} icon="warning-outline">
                                    <LinkRows
                                        rows={[
                                            { icon: 'exit-outline', title: copy.logoutAll, danger: true, onPress: isLoggingOut ? undefined : logoutFromAllDevicesWithConfirmation },
                                            accountRows.remove,
                                        ]}
                                    />
                                </PanelGroup>
                            </DangerZone>
                        </>
                    )}
                </ProfilePanel>
            </ProfileLayout>

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
    stars: { ...StyleSheet.absoluteFillObject, backgroundImage: gradients.stars },
    groupActions: { justifyContent: 'flex-end' },

    /* bank */
    bankRow: { gap: 24, alignItems: 'flex-start' },
    bankCard: {
        width: 340,
        height: 210,
        flexShrink: 0,
        padding: 22,
        justifyContent: 'space-between',
        borderRadius: radii.xl,
        overflow: 'hidden',
        backgroundImage: gradients.hero,
        boxShadow: elevation.floating,
        borderWidth: 1,
        borderColor: onDark.hairline,
    },
    bankTop: { alignItems: 'center', justifyContent: 'space-between' },
    chip: { width: 44, height: 32, borderRadius: 7, backgroundImage: gradients.gold, opacity: 0.9 },
    contactless: { transform: 'rotate(90deg)' },
    bankNumber: { color: onDark.text, fontSize: 21, letterSpacing: 2.5, textAlign: 'center', writingDirection: 'ltr' },
    bankBottom: { alignItems: 'flex-end', gap: 12 },
    bankLabel: { color: onDark.muted, fontSize: 11 },
    bankName: { color: onDark.text, fontSize: 14.5, marginTop: 2 },
    bankLogo: { color: palette.gold, fontSize: 16, letterSpacing: 3 },
    bankFields: { gap: 16 },

    /* captcha */
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
