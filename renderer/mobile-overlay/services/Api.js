import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, buildApiUrl } from './ApiEndpoints';
import { handleExpiredSession } from './axiosConfig';
import { handleError, showToastOrAlert } from '@helpers/Common';
import i18next from 'i18next';
import { appendUploadFile } from './uploadFile';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_ENDPOINTS.BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept-Language': i18next.language || 'fa', // Default language header
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    config.headers['Accept-Language'] = i18next.language || 'fa';
    // Add auth token if available
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log error but don't show toast automatically for verification endpoints
    const path = error.config?.url ?? '';
    if (error.response?.status === 401 && !/\/(?:auth\/|organization\/(?:login|register|verify-phone|resend-code|validate-token|logout))/.test(path)) {
      await handleExpiredSession(error);
    }
    if (error.config?.url?.includes('/auth/verify-phone') ||
      error.config?.url?.includes('/auth/verify-reset-code')) {
      console.log('Verification error (no toast):', error.response?.data);
    } else {
      const message = error.response?.data?.message || 'خطایی رخ داده است';
      showToastOrAlert(message);
    }
    return Promise.reject(error);
  }
);

// Authentication endpoints
export const authAPI = {
  // Register user
  // Expected payload: { melicode, phone, email, other_referral_code }
  register: async (userData) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Resend verification code
  resendCode: async (phone) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.RESEND_CODE, {
        phone
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Login user
  // Expected payload: { phone, password }
  login: async (credentials) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Validate token
  // Check if token is valid and get user info
  validateToken: async (token) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.VALIDATE_TOKEN, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Logout user
  logout: async (token, lang) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Language': lang || 'en'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Logout API error:', error);
      throw error;
    }
  },

  // Logout from all devices
  logoutAll: async (token) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT_ALL, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Logout all API error:', error);
      throw error;
    }
  },

  // Forgot password - request password reset
  forgotPassword: async (userData) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        melicode: userData.melicode,
        phone: userData.phone,
        email: userData.email,
        hashApp: userData.hashApp
      });
      return response.data;
    } catch (error) {
      console.error('Forgot password API error:', error);
      throw error;
    }
  },

  // Verify reset code for forgot password
  verifyResetCode: async (userData) => {
    try {
      console.log('verifyResetCode called with:', userData);
      console.log('API endpoint:', API_ENDPOINTS.AUTH.VERIFY_RESET_CODE);

      const requestData = {
        phone: userData.phone?.toString().trim(),
        verification_code: userData.code?.toString().trim()
      };

      console.log('Request data:', requestData);

      const response = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_RESET_CODE, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      console.log('verifyResetCode response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Verify reset code API error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  },

  // Resend reset code for forgot password
  resendResetCode: async (phone) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.RESEND_RESET_CODE, {
        phone: phone?.toString().trim()
      });
      return response.data;
    } catch (error) {
      console.error('Resend reset code API error:', error);
      throw error;
    }
  },

  // Verify phone number with code (for regular registration)
  // `legacyCode` supports the older two-argument call shape: verifyPhone(phone, code).
  verifyPhone: async (userData, legacyCode) => {
    try {
      console.log('verifyPhone called with:', userData);
      console.log('API endpoint:', API_ENDPOINTS.AUTH.VERIFY_PHONE);
      console.log('Base URL:', API_ENDPOINTS.BASE_URL);

      // Handle both formats: object with phone/code OR direct phone, code parameters
      let requestData;
      if (typeof userData === 'object' && userData.phone) {
        requestData = {
          phone: userData.phone?.toString().trim(),
          verification_code: userData.code?.toString().trim()
        };
      } else {
        // Legacy format - first param is phone, second is code
        requestData = {
          phone: userData?.toString().trim(),
          verification_code: legacyCode?.toString().trim()
        };
      }

      console.log('Request data:', requestData);

      const response = await apiClient.post(API_ENDPOINTS.AUTH.VERIFY_PHONE, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      console.log('verifyPhone response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Verify phone API error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
          headers: error.config?.headers,
        }
      });
      throw error;
    }
  }
};

// User Profile Management endpoints
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER.PROFILE);
      return response.data;
    } catch (error) {
      console.error('Get profile API error:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      // اگر FormData است (برای آپلود عکس)
      if (profileData instanceof FormData) {
        console.log('📤 Sending FormData (with image) to server...');
        // Laravel با FormData و _method=PUT نیاز به POST دارد
        const response = await apiClient.post(
          API_ENDPOINTS.USER.UPDATE_PROFILE,
          profileData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 30000, // 30 seconds for file upload
          }
        );
        console.log('✅ Profile updated successfully with image');
        return response.data;
      }

      // اگر JSON است (بدون عکس)
      const cleanData = {};
      Object.keys(profileData).forEach(key => {
        if (profileData[key] !== undefined && profileData[key] !== null && profileData[key] !== '') {
          cleanData[key] = profileData[key];
        }
      });

      console.log('📤 Updating profile with JSON data:', cleanData);

      const response = await apiClient.put(API_ENDPOINTS.USER.UPDATE_PROFILE, cleanData);
      console.log('✅ Profile updated successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Update profile API error:', error);
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await apiClient.patch(API_ENDPOINTS.USER.CHANGE_PASSWORD, {
        password: passwordData.newPassword,
        current_password: passwordData.currentPassword
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Order endpoints
export const orderAPI = {
  // Get orders summary
  getOrdersSummary: async () => {
    try {
      const response = await apiClient.get('/orders/summary');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Fault Report endpoints
export const faultReportAPI = {
  // Submit a new fault report
  create: async (data) => {
    try {
      const response = await apiClient.post('/fault-reports', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all fault reports for the user
  getAll: async () => {
    try {
      const response = await apiClient.get('/fault-reports');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get details of a specific fault report
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/fault-reports/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Education Registration endpoints
export const educationRegistrationAPI = {
  // Create new education registration
  create: async (data) => {
    try {
      const response = await apiClient.post('/loop-learn-api-submit', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all education registrations for the user
  getAll: async () => {
    try {
      const response = await apiClient.get('/education-registerations');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get details of a specific education registration
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/education-registerations/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Address endpoints
export const addressAPI = {
  // Get all user addresses
  getAll: async () => {
    try {
      const response = await apiClient.get('/addresses');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get address by ID
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/addresses/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new address
  create: async (data) => {
    try {
      const response = await apiClient.post('/addresses', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update address
  update: async (id, data) => {
    try {
      const response = await apiClient.put(`/addresses/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete address
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/addresses/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Notes API
export const notesAPI = {
  // Get all user notes
  getAll: async () => {
    try {
      const response = await apiClient.get('/notes');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get note by ID
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/notes/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new note
  create: async (data) => {
    try {
      const response = await apiClient.post('/notes', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update note
  update: async (id, data) => {
    try {
      const response = await apiClient.put(`/notes/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete note
  delete: async (id) => {
    try {
      const response = await apiClient.delete(`/notes/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export const getTicketsList = async () => {
  try {
    console.log('📨 دریافت لیست پیام‌های پشتیبانی...');

    const response = await apiClient.get('/tickets');

    console.log('✅ لیست پیام‌ها دریافت شد:', {
      total: response.data?.total || 0,
      messages: response.data?.data?.length || 0
    });

    // پیوست فایل در پیام‌ها فقط وقتی فعال می‌شود که سرور صریحاً بگوید پشتیبانی
    // می‌کند؛ وگرنه فایل‌ها بی‌صدا دور ریخته می‌شدند و کاربر خبر نداشت.
    return {
      ...handleResponse(response),
      attachmentsSupported: response.data?.attachments_supported === true,
    };
  } catch (error) {
    console.error('❌ خطا در دریافت پیام‌ها:', error.response?.data || error.message);
    return handleError(error);
  }
};
/**
 * ارسال پیام پشتیبانی، با پیوست‌های اختیاری (تصویر / PDF).
 *
 * @param {string} message
 * @param {Array<{ uri: string, name: string, mimeType?: string, file?: File }>} [attachments]
 */
export const sendTicketMessage = async (message, attachments = []) => {
  try {
    console.log('📤 ارسال پیام جدید...');
    console.log('📝 طول پیام:', message?.length || 0);

    let response;
    if (attachments.length > 0) {
      const formData = new FormData();
      formData.append('message', message || '');
      for (const attachment of attachments) {
        await appendUploadFile(formData, 'attachments[]', attachment);
      }
      response = await apiClient.post('/tickets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
    } else {
      response = await apiClient.post('/tickets', { message });
    }

    console.log('✅ پیام با موفقیت ارسال شد:', response.data);

    return handleResponse(response);
  } catch (error) {
    console.error('❌ خطا در ارسال پیام:', error.response?.data || error.message);

    if (error.response?.status === 422) {
      const errors = error.response?.data?.errors;
      if (errors) {
        const errorMessages = Object.values(errors).flat().join('\n');
        throw new Error(errorMessages);
      }
      throw new Error('لطفاً متن پیام را به درستی وارد کنید');
    }

    return handleError(error);
  }
};
const handleResponse = (response) => {
  return {
    success: true,
    data: response.data.data || response.data,
    message: response.data.message || 'عملیات با موفقیت انجام شد',
  };
};

// Info endpoints (Public APIs - no authentication needed)
export const infoAPI = {
  // Get FAQs
  getFAQs: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.INFO.FAQS);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get Terms
  getTerms: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.INFO.TERMS);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get Privacy Policy
  getPrivacy: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.INFO.PRIVACY);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get Warranty Information
  getWarranty: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.INFO.WARRANTY);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get Organization Terms
  getOrganizationTerms: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.INFO.ORGANIZATION_TERMS);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default apiClient;
