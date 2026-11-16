import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uri } from '@services/URL';
import { 
  setAccessStatus, 
  setAccessLoading,
  updateProfileStatus,
  updateContractStatus,
  clearAccessData
} from '@slices/organizationSlice';
import { setUserType } from '@slices/authSlice';
import { 
  useDebouncedCallback, 
  organizationAccessCache,
  PERFORMANCE_CONFIGS 
} from '@utils/performanceOptimization';
import { useTranslation } from 'react-i18next';

/**
 * Hook برای کنترل دسترسی کاربران سازمانی
 * 
 * @returns {Object} شامل وضعیت دسترسی، loading، و توابع کمکی
 */
export const useOrganizationAccess = () => {
  const dispatch = useDispatch();
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  
  const { userType, token, isAuthenticated } = useSelector(state => state.auth);
  const { 
    accessStatus, 
    accessLoading,
    profileStatus, 
    contractStatus, 
    hasCompleteAccess,
    blockedMessage,
    nextSteps,
    profileRejectionReason,
    contractRejectionReason,
    lastStatusCheck 
  } = useSelector(state => state.organization);

  // 🔍 DEBUG: Log Redux state
  console.log('🔍 useOrganizationAccess Redux state:', {
    profileStatus,
    contractStatus,
    hasCompleteAccess,
    accessStatus: accessStatus ? 'exists' : 'null',
    userType,
    isAuthenticated,
    token: token ? 'exists' : 'null'
  });

  // 🔒 SECURITY FIX: دسترسی پیش‌فرض باید محدود باشد
  // فقط بعد از تایید، دسترسی داده می‌شود
  const actualHasCompleteAccess = (() => {
    // اگر لاگین نکرده، هیچ دسترسی نداره
    if (!isAuthenticated || !token) {
      return false;
    }
    
    // اگر userType هنوز مشخص نیست، سعی کن از AsyncStorage بخونی
    if (!userType || userType === null) {
      // برای امنیت، در حالی که userType load می‌شه، دسترسی محدود باشد
      return false;
    }
    
    // کاربران فردی دسترسی آزاد دارند
    if (userType === 'individual') {
      return true;
    }
    
    // کاربران سازمانی فقط با تایید کامل
    if (userType === 'organization') {
      return hasCompleteAccess === true;
    }
    
    // در هر حالت دیگر، محدود
    return false;
  })();
  
  /**
   * دریافت وضعیت دسترسی از سرور (با performance optimization)
   */
  const fetchAccessStatus = useDebouncedCallback(async (forceRefresh = false) => {
    // 🔒 SECURITY: فقط کاربران فردی احراز هویت شده دسترسی آزاد دارند
    // اگر token نداریم یا authenticated نیستیم، هیچ دسترسی نمی‌دهیم
    if (!token || !isAuthenticated) {
      // کاربر لاگین نکرده - بدون دسترسی
      return;
    }
    
    // اگر کاربر فردی است (نه سازمانی)، دسترسی آزاد
    if (userType === 'individual') {
      dispatch(setAccessStatus({
        profile_status: 'approved',
        contract_status: 'approved',
        has_complete_access: true
      }));
      return;
    }
    
    // اگر userType هنوز مشخص نیست، منتظر بمانیم
    if (!userType || userType === null) {
      return;
    }
    
    // از اینجا به بعد، فقط کاربران سازمانی می‌رسند
    if (userType !== 'organization') {
      return;
    }

    // بررسی cache با استفاده از performanceOptimization
    const cacheKey = `org_access_${token?.slice(-10)}`;
    if (!forceRefresh) {
      const cachedData = organizationAccessCache.get(cacheKey);
      if (cachedData) {
        console.log('📱 Using cached organization access data');
        dispatch(setAccessStatus(cachedData));
        return cachedData;
      }
    }
    
    try {
      dispatch(setAccessLoading(true));
      setError(null);
      
      const response = await axios.get(`${uri}/organization/profile/status`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
       
      
      if (response.data.success) {
        console.log('📥 Dispatching setAccessStatus with data:', response.data.data);
        dispatch(setAccessStatus(response.data.data));
        
        // Cache the successful result
        organizationAccessCache.set(cacheKey, response.data.data, PERFORMANCE_CONFIGS.CACHE_TTL);
      } else {
        throw new Error(response.data.message || t('Error fetching information'));
      }
    } catch (error) { 
      
      if (error.response?.status === 401) {
        // Token منقضی شده
        setError(t('Please log in again.'));
      } else if (error.response?.status === 403) {
        // دسترسی غیرمجاز
        setError(t('You are not an organization user.'));
      } else if (error.response?.status === 500) {
        setError(t('Server error, please try again.'));
      } else {
        setError(error.message || t('Error fetching access information.'));
      }
      
      // در صورت خطا، دسترسی محدود قرار دهیم
      dispatch(setAccessStatus({
        profile_status: 'pending',
        contract_status: 'pending',
        has_complete_access: false,
        blocked_message: t('Error fetching access information.')
      }));
    } finally {
      dispatch(setAccessLoading(false));
    }
  }, PERFORMANCE_CONFIGS.API_DEBOUNCE_DELAY, [userType, token, isAuthenticated, dispatch]);

  /**
   * Load userType از AsyncStorage اگر null باشه
   * 🔒 SECURITY FIX: اگر در AsyncStorage نبود، از API بپرس (نه اینکه default individual فرض کنیم)
   */
  useEffect(() => {
    const loadUserType = async () => {
      if (!userType && isAuthenticated && token) {
        try {
          const savedUserType = await AsyncStorage.getItem('accountType');
          if (savedUserType) {
            console.log('📱 Loading userType from AsyncStorage:', savedUserType);
            dispatch(setUserType(savedUserType));
          } else {
            // 🔒 SECURITY: اگر userType در AsyncStorage نیست، از API بپرس
            console.log('⚠️ No userType in AsyncStorage, fetching from API...');
            try {
              // سعی کن از endpoint سازمانی بپرسیم
              const orgResponse = await axios.get(`${uri}/organization/profile/status`, {
                headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json'
                }
              });
              
              if (orgResponse.data.success) {
                // کاربر سازمانی است
                console.log('✅ User is organization type');
                dispatch(setUserType('organization'));
                await AsyncStorage.setItem('accountType', 'organization');
              } else {
                throw new Error('Not an organization user');
              }
            } catch (apiError) {
              // اگر API سازمانی جواب نداد، پس فردی است
              if (apiError.response?.status === 403 || apiError.response?.status === 404) {
                console.log('✅ User is individual type (org API returned 403/404)');
                dispatch(setUserType('individual'));
                await AsyncStorage.setItem('accountType', 'individual');
              } else {
                console.error('❌ Error determining user type from API:', apiError);
                // در صورت خطای شبکه، منتظر بمانیم (نه اینکه individual فرض کنیم)
                setError(t('Error determining account type. Please try again.'));
              }
            }
          }
        } catch (error) {
          console.error('📱 Error loading userType from AsyncStorage:', error);
          setError(t('Error loading account information.'));
        }
      }
    };

    loadUserType();
  }, [userType, isAuthenticated, token, dispatch]);

  /**
   * پاک کردن داده‌های دسترسی (برای logout)
   */
  const clearAccess = useCallback(() => {
    dispatch(clearAccessData());
    
    // Clear cache on logout
    const cacheKey = `org_access_${token?.slice(-10)}`;
    organizationAccessCache.delete(cacheKey);
  }, [dispatch, token]);
  
  /**
   * چک کردن دسترسی به صفحه خاص
   */
  const canAccessScreen = useCallback((screenName) => {
    // 🔓 اگر لاگین نکرده، اجازه دسترسی بده (صفحه لاگین نشون میده)
    if (!isAuthenticated || !token) {
      return true;
    }
    
    // 🔒 اگر userType هنوز مشخص نیست، بگذار withOrganizationAccess loading نشون بده
    // بنابراین true برمی‌گردانیم تا به withOrganizationAccess برسد و آنجا loading نمایش دهد
    if (!userType || userType === null) {
      return true; // تغییر از false به true
    }
    
    // کاربران فردی دسترسی آزاد دارند
    if (userType === 'individual') {
      return true;
    }
    
    // کاربران سازمانی - ادامه چک‌ها
    if (userType !== 'organization') {
      return false;
    }
    
    // اگر دسترسی کامل داره، همه صفحات مجاز
    if (hasCompleteAccess) {
      return true;
    }
    
    // صفحات همیشه مجاز برای کاربران سازمانی
    const alwaysAllowedScreens = [
      'ComprehensiveSelectionScreen',
      // صفحات مربوط به مدیریت حساب سازمانی
      'OrganizationProfile',
      'OrganizationContract', 
      'AccountSettings',
      'Profile',
      'Settings',
      
      // صفحات مربوط به مدیریت حساب شخصی
      'AddressScreen',
      'PaymentScreen',
      'Wallet', // مشاهده‌ی کیف پول — دسترسی کمتری از شارژ کردن لازم دارد
      'Increase', // افزایش اعتبار
      
      // صفحات عمومی
      'Landing',
      'Welcome',
      
      // صفحات مربوط به احراز هویت
      'Login',
      'LoginScreen', 
      'Register',
      'SignInLanding',
      'MainSignIn',
      'RegistrationVerificationScreen',
      'ForgotPassword',
      'ResetPasswordScreen',
      
      // صفحات resources و اطلاعات
      'PrivacyScreen',
      'LearnMoreScreen',
      'AboutScreen',
      'WarrantyScreen',
      
      // صفحات پشتیبانی
      'ViolationReportScreen',
      'FeedbackSurveyScreen',
      
      // صفحه محدودیت دسترسی خود
      'AccessRestrictedScreen'
    ];
    
    return alwaysAllowedScreens.includes(screenName);
  }, [userType, hasCompleteAccess]);
  
  /**
   * چک کردن امکان ثبت سفارش
   */
  const canPlaceOrder = useCallback(() => {
    // � اگر لاگین نکرده، اجازه دسترسی بده (صفحه لاگین نشون میده)
    if (!isAuthenticated || !token) {
      return true;
    }
    
    // �🔒 اگر userType هنوز مشخص نیست، دسترسی ندهیم
    if (!userType || userType === null) {
      return false;
    }
    
    // کاربران فردی می‌توانند سفارش ثبت کنند
    if (userType === 'individual') {
      return true;
    }
    
    // کاربران سازمانی فقط با دسترسی کامل
    if (userType === 'organization') {
      return actualHasCompleteAccess;
    }
    
    return false;
  }, [userType, actualHasCompleteAccess]);
  
  /**
   * گرفتن پیام محدودیت
   */
  const getBlockedMessage = useCallback(() => {
    // 🔒 اگر userType مشخص نیست
    if (!userType || userType === null) {
      return t('Checking user status...');
    }
    
    if (userType === 'individual' || actualHasCompleteAccess) {
      return null;
    }
    
    return blockedMessage || t('Please wait for admin approval.');
  }, [userType, actualHasCompleteAccess, blockedMessage]);
  
  /**
   * گرفتن لیست مراحل بعدی
   */
  const getNextSteps = useCallback(() => {
    // 🔒 اگر userType مشخص نیست
    if (!userType || userType === null) {
      return [];
    }
    
    if (userType === 'individual' || actualHasCompleteAccess) {
      return [];
    }
    
    // اگر از API مراحل دریافت کرده‌ایم، استفاده کنیم
    if (nextSteps && nextSteps.length > 0) {
      return nextSteps.map(step => {
        switch (step) {
          case 'upload_contract': return t('Upload signed contract');
          case 'wait_for_approval': return t('Waiting for admin approval');
          case 'complete_profile': return t('Complete profile information');
          default: return step;
        }
      });
    }
    
    // اگر نه، خودمان محاسبه می‌کنیم
    const steps = [];
    
    if (profileStatus === 'rejected') {
      steps.push(t('Edit and correct profile information'));
    }
    
    if (contractStatus === 'not_uploaded') {
      steps.push(t('Upload signed contract'));
    } else if (contractStatus === 'rejected') {
      steps.push(t('Re-upload contract after fixing issues'));
    }
    
    if (profileStatus === 'pending' || contractStatus === 'pending') {
      steps.push(t('Waiting for admin approval'));
    }
    
    return steps;
  }, [userType, actualHasCompleteAccess, profileStatus, contractStatus, nextSteps]);
  
  // 🔧 FIX: فقط یک useEffect برای بارگذاری
  // بارگذاری وقتی userType، token یا isAuthenticated تغییر می‌کند
  useEffect(() => {
    if (isAuthenticated && token && userType) {
      fetchAccessStatus();
    }
  }, [userType, token, isAuthenticated]); // fetchAccessStatus رو حذف کردیم تا dependency loop نداشته باشیم
  
  /**
   * بروزرسانی دستی وضعیت پروفایل
   */
  const updateProfile = useCallback((status) => {
    dispatch(updateProfileStatus(status));
  }, [dispatch]);

  /**
   * بروزرسانی دستی وضعیت توافق نامه
   */
  const updateContract = useCallback((status) => {
    dispatch(updateContractStatus(status));
  }, [dispatch]);

  return {
    // وضعیت اصلی
    accessStatus,
    loading: accessLoading,
    error,
    
    // وضعیت‌های محاسبه شده
    hasCompleteAccess: actualHasCompleteAccess,
    isOrganizationUser: isAuthenticated && token && userType === 'organization',
    
    // وضعیت‌های جزئی
    profileStatus,
    contractStatus,
    
    // پیام‌ها و مراحل
    blockedMessage,
    nextSteps,
    
    // توابع کمکی
    canAccessScreen,
    canPlaceOrder,
    getBlockedMessage,
    getNextSteps,
    
    // توابع بارگذاری و بروزرسانی
    refetch: () => fetchAccessStatus(true), // force refresh
    fetchAccessStatus,
    updateProfile,
    updateContract,
    clearAccess,
    
    // پیام‌های خطا و رد (از Redux state)
    profileRejectionReason,
    contractRejectionReason,
    
    // تاریخ‌های تایید
    profileApprovedAt: accessStatus?.profile_approved_at,
    contractApprovedAt: accessStatus?.contract_approved_at,
    
    // Cache info
    lastStatusCheck,
    cacheStats: organizationAccessCache.getStats(),
  };
};

export default useOrganizationAccess;
