import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { handleApiError, handleOrganizationApiError } from '@utils/apiErrorHandler';
import i18next from 'i18next';
import { notifySessionExpired, SESSION_EXPIRY_REASON } from './sessionExpiry';

/**
 * Navigation reference برای استفاده در interceptors
 * این reference باید از App.js یا RootNavigation.js set شود
 */
let navigationRef = null;
let onSessionExpired = null;

/**
 * تنظیم navigation reference برای استفاده در error handling
 *
 * @param {Object} navRef - Navigation reference
 */
export const setNavigationRef = (navRef, expireSession) => {
  navigationRef = navRef;
  onSessionExpired = expireSession ?? null;
  console.log('🧭 Navigation reference set for API error handling');
};

/**
 * گرفتن navigation reference
 */
export const getNavigationRef = () => navigationRef;

export async function handleExpiredSession(error) {
  const authorization = error.config?.headers?.Authorization;
  if (error.response?.status !== 401 || typeof authorization !== 'string'
      || !authorization.startsWith('Bearer ') || !onSessionExpired) return;

  try {
    await onSessionExpired(authorization.slice(7), navigationRef?.current);
  } catch (sessionError) {
    console.warn('Unable to clear expired customer session:', sessionError?.message);
  }
}

/**
 * Axios instance اصلی برای تمام درخواست‌ها
 */
const apiClient = axios.create({
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Language': i18next.language || 'en', // Default language header
  },
});

/**
 * Request Interceptor - اضافه کردن token به header
 */
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // اضافه کردن token از AsyncStorage
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // لاگ کردن درخواست (فقط در محیط development)
      if (__DEV__) {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          headers: config.headers,
          data: config.data ? 'Has data' : 'No data',
          timeout: config.timeout,
        });
      }

      return config;
    } catch (error) {
      console.error('❌ Request interceptor error:', error);
      return config; // در صورت خطا، درخواست رو بدون token ارسال کن
    }
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor - مدیریت خطاهای مربوط به access control
 */
apiClient.interceptors.response.use(
  (response) => {
    // لاگ موفقیت‌آمیز responses در محیط development
    if (__DEV__) {
      console.log(
        `✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`,
        {
          status: response.status,
          success: response.data?.success,
          hasData: !!response.data?.data,
        }
      );
    }
    return response;
  },
  async (error) => {
    // لاگ خطا
    console.error('❌ API Response Error:', {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      errorCode: error.response?.data?.error_code,
      message: error.response?.data?.message,
    });

    // بعضی از درخواست‌ها background و best-effort هستند و خودشان خطا را
    // مدیریت می‌کنند؛ نباید interceptor برایشان alert سراسری نشان بدهد.
    if (isSilentAPI(error.config?.url)) {
      return Promise.reject(error);
    }

    // ۴۰۱ یعنی توکن باطل/منقضی شده است: کاربر باید دوباره وارد شود.
    // 401 means the bearer token is gone, revoked or expired. Announce it on
    // the session bus instead of alerting here: the bus de-duplicates (a screen
    // firing five parallel requests gets five 401s and must see one sheet), and
    // it works even before a navigation ref exists — during the startup token
    // check, for instance. `<SessionExpiredSheet />` owns the UI and the cleanup.
    if (error.response?.status === 401 && wasAuthenticatedRequest(error.config)) {
      notifySessionExpired(SESSION_EXPIRY_REASON.UNAUTHORIZED);
      return Promise.reject(error);
    }

    // درخواستی که صفحه‌اش خودش پیام خطا را نشان می‌دهد (مثلاً بخش‌های «امنیت حساب»
    // که endpointهایشان هنوز روی سرور نیست و باید «به‌زودی» نشان دهند، نه alert
    // «خطا»). برخلاف isSilentAPI، ۴۰۱ بالا همچنان کشوی نشست را باز می‌کند.
    if (error.config?.skipGlobalErrorAlert) {
      return Promise.reject(error);
    }

    // اگر navigation reference وجود داره، از error handler استفاده کن
    if (navigationRef?.current) {
      const navigation = navigationRef.current;

      // برای API های مربوط به سازمان از specialized handler استفاده کن
      if (isOrganizationRelatedAPI(error.config?.url)) {
        const handled = handleOrganizationApiError(error, navigation, {
          showGenericErrorAlert: false, // در interceptor، alert نشون نمیدیم
        });

        if (handled && error.response?.status === 403) {
          // اگر 403 بود و handle شد، error رو pass نکن تا component متوجه بشه
          return Promise.reject(error);
        }
      } else {
        // برای سایر API ها از handler کلی استفاده کن
        handleApiError(error, navigation);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * آیا این درخواست با توکن ارسال شده بود؟
 *
 * Did this request actually carry a bearer token?
 *
 * A 401 on a request that never had one just means the endpoint needs a login —
 * the user's session did not "expire", because there was none. Only the
 * authenticated case should raise the session-expiry sheet.
 *
 * @param {object} config - axios request config
 * @returns {boolean}
 */
const wasAuthenticatedRequest = (config) => {
  const headers = config?.headers || {};
  return Boolean(headers.Authorization || headers.authorization);
};

/**
 * تشخیص API های مربوط به سازمان
 *
 * @param {string} url - URL درخواست
 * @returns {boolean} - آیا مربوط به سازمان است یا نه
 */
const isOrganizationRelatedAPI = (url) => {
  if (!url) return false;

  const organizationAPIs = [
    '/organization',
    '/orders',
    '/contracts',
    '/technicians',
    '/payments',
    '/reviews',
  ];

  return organizationAPIs.some((api) => url.includes(api));
};

/**
 * تشخیص API هایی که background / best-effort هستند: خطای آن‌ها نباید در
 * interceptor باعث alert یا navigation سراسری شود، چون خود صدازننده خطا را
 * مدیریت می‌کند (مثلاً ثبت device-token برای نوتیفیکیشن که در نبود پشتیبانی
 * no-op می‌شود).
 *
 * @param {string} url - URL درخواست
 * @returns {boolean} - آیا درخواست silent است یا نه
 */
export const isSilentAPI = (url) => {
  if (!url) return false;

  const silentAPIs = [
    // کل خانواده‌ی /notifications/ بهترین-تلاش است: ثبت device-token و پیامک‌های
    // تاییدیه. صدازننده خودش خطا را مدیریت می‌کند، پس interceptor نباید alert
    // دوم نشان بدهد یا کاربر را وسط ثبت سفارش به صفحه‌ی دیگری بفرستد.
    '/notifications/',

    // خواندنِ پس‌زمینه‌ی کیف پول: موجودی و تاریخچه روی focus هر صفحه‌ی مرتبط
    // تازه می‌شوند. یک refresh ناموفق نباید نشست کاربر را تمام کند و او را
    // وسط کار به صفحه‌ی ورود بیندازد — صفحه خودش خطا را نمایش می‌دهد و موجودیِ
    // قبلی سر جایش می‌ماند.
    //
    // Background wallet reads. `/wallet/balance` and `/wallet/transactions`
    // refresh on focus, so a failing one would otherwise raise the
    // session-expiry sheet every time the user opens the wallet, the invoice or
    // an order — turning a read that nobody asked for into a forced logout.
    // The money actions below are deliberately NOT here: `/wallet/charge`,
    // `/wallet/pay-order` and `/orders/gateway-payment` are user-initiated, and
    // a dead session on those must be reported properly.
    '/wallet/balance',
    '/wallet/transactions',

    // ثبت دستگاه پس از ورود و بررسی نسخه‌ی اپ - هر دو پس‌زمینه و بهترین-تلاش.
    '/account/devices/register',
    '/app/version',
  ];

  return silentAPIs.some((api) => url.includes(api));
};

/**
 * Helper function برای ایجاد درخواست با retry mechanism
 *
 * @param {Function} apiCall - تابع API call
 * @param {number} maxRetries - حداکثر تعداد تلاش مجدد
 * @param {number} retryDelay - تأخیر بین تلاش‌ها (میلی‌ثانیه)
 * @returns {Promise} - نتیجه API call
 */
export const withRetry = async (apiCall, maxRetries = 3, retryDelay = 1000) => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;

      // اگر خطای 4xx باشه، retry نکن
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }

      // اگر آخرین تلاش بود، خطا رو بالا بفرست
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // منتظر بمان قبل از تلاش بعدی
      await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));

      console.log(`🔄 Retrying API call, attempt ${attempt + 2}/${maxRetries}`);
    }
  }

  throw lastError;
};

/**
 * Helper function برای timeout سفارشی
 *
 * @param {Function} apiCall - تابع API call
 * @param {number} timeoutMs - timeout به میلی‌ثانیه
 * @returns {Promise} - نتیجه API call یا timeout error
 */
export const withTimeout = (apiCall, timeoutMs = 10000) => {
  return Promise.race([
    apiCall(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeoutMs)),
  ]);
};

/**
 * Helper function برای cache کردن response ها
 */
const responseCache = new Map();

export const withCache = (cacheKey, apiCall, ttlMs = 5 * 60 * 1000) => {
  return async () => {
    const now = Date.now();
    const cached = responseCache.get(cacheKey);

    // اگر cache معتبر است، آن را برگردان
    if (cached && now - cached.timestamp < ttlMs) {
      console.log(`📦 Using cached response for: ${cacheKey}`);
      return cached.data;
    }

    // اگر نه، درخواست جدید بفرست
    try {
      const response = await apiCall();

      // Response را cache کن
      responseCache.set(cacheKey, {
        data: response,
        timestamp: now,
      });

      console.log(`💾 Cached response for: ${cacheKey}`);
      return response;
    } catch (error) {
      // در صورت خطا، cache قدیمی را برگردان اگر داریم
      if (cached) {
        console.log(`⚠️ Using stale cache due to error for: ${cacheKey}`);
        return cached.data;
      }
      throw error;
    }
  };
};

/**
 * پاک کردن کل cache
 */
export const clearCache = () => {
  responseCache.clear();
  console.log('🗑️ API cache cleared');
};

/**
 * پاک کردن cache خاص
 */
export const clearCacheKey = (cacheKey) => {
  responseCache.delete(cacheKey);
  console.log(`🗑️ Cleared cache for: ${cacheKey}`);
};

export { apiClient };
export default apiClient;
