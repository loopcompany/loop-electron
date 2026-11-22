import { emptyUser } from '@slices/userSlice';
import { clearOrders } from '@slices/ordersSlice';
import { useState } from 'react';
import { Platform } from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import TokenManager from '@services/TokenManager';
import { setToken, setUserType } from '@slices/authSlice';
import { clearOrganizationData } from '@slices/organizationSlice';
import { showAlert } from '@helpers/Common';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setLanguage } from '@slices/languageSlice';

// Custom hook for logout functionality
export const useLogout = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Simple logout
  const logout = async () => {
    try {
      setIsLoggingOut(true);

      const result = await TokenManager.logout();

      if (result.success) {
        // Clear Redux state
        dispatch(setToken(null));
        dispatch(setUserType(null));
        dispatch(clearOrganizationData());
        dispatch(emptyUser());
        dispatch(clearOrders());

        return result;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Logout with confirmation dialog
  const logoutWithConfirmation = (options = {}) => {
    if (Platform.OS === 'web') {
      // Use window.confirm for web
      if (typeof window !== 'undefined' && window.confirm) {
        const confirmed = window.confirm(t('Are you sure you want to log out?'));

        if (confirmed) {
          logout()
            .then((result) => {
              if (typeof options.onSuccess === 'function') {
                try { options.onSuccess(); } catch { }
              }
              if (window.alert) {
                window.alert(result.message || t('You have successfully logged out!'));
              }
              // Navigate to Welcome screen after alert
              if (navigation.replace) {
                navigation.replace('Welcome');
              } else {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Welcome' }],
                });
              }
            })
            .catch((error) => {
              if (window.alert) {
                window.alert(error.message || t('Unexpected error during logout'));
              }
            });
        }
      } else {
        // Fallback: just logout without confirmation
        console.warn('window.confirm not available, logging out without confirmation');
        logout()
          .then(() => {
            if (typeof options.onSuccess === 'function') {
              try { options.onSuccess(); } catch { }
            }
            if (navigation.replace) {
              navigation.replace('Welcome');
            } else {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            }
          })
          .catch(error => console.error('Logout error:', error));
      }
    } else {
      // Use Alert.alert for mobile
      showAlert(
        t('Log Out'),
        t('Are you sure you want to log out?'),
        [
          {
            text: t('Cancel'),
            style: 'cancel',
          },
          {
            text: t('Log Out'),
            style: 'destructive',
            onPress: async () => {
              try {
                const result = await logout();
                if (typeof options.onSuccess === 'function') {
                  try { options.onSuccess(); } catch { }
                }
                showAlert(t('Successful'), result.message, [
                  {
                    text: t('Ok'),
                    onPress: async () => {
                      // Navigate to Welcome screen after showing alert
                      await AsyncStorage.removeItem("language")
                      dispatch(setLanguage("fa"))
                      await i18n.changeLanguage("fa");
                      if (navigation.replace) {
                        navigation.replace('Welcome');
                      } else {
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'Welcome' }],
                        });
                      }
                    }
                  }
                ]);
              } catch (error) {
                showAlert(t('Error'), error.message || t('Unexpected error during logout'));
              }
            },
          },
        ]
      );
    }
  };

  // Logout from all devices
  const logoutFromAllDevices = async () => {
    try {
      setIsLoggingOut(true);

      const result = await TokenManager.logoutFromAllDevices();

      if (result.success) {
        // Clear Redux state
        dispatch(setToken(null));
        dispatch(setUserType(null));
        dispatch(clearOrganizationData());
        dispatch(emptyUser());
        dispatch(clearOrders());

        return result;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Logout all error:', error);
      throw error;
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Logout from all devices with confirmation
  const logoutFromAllDevicesWithConfirmation = () => {
    if (Platform.OS === 'web') {
      // Use window.confirm for web
      if (typeof window !== 'undefined' && window.confirm) {
        const confirmed = window.confirm(t('Do you want to log out from all devices logged in with this account?'));

        if (confirmed) {
          logoutFromAllDevices()
            .then((result) => {
              if (window.alert) {
                window.alert(result.message || t('Successfully logged out from all devices'));
              }
              // Navigate to Welcome screen after alert
              if (navigation.replace) {
                navigation.replace('Welcome');
              } else {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Welcome' }],
                });
              }
            })
            .catch((error) => {
              if (window.alert) {
                window.alert(error.message || t('Unexpected error logging out from all devices'));
              }
            });
        }
      } else {
        // Fallback: just logout without confirmation
        console.warn('window.confirm not available, logging out from all devices without confirmation');
        logoutFromAllDevices()
          .then(() => {
            if (navigation.replace) {
              navigation.replace('Welcome');
            } else {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            }
          })
          .catch(error => console.error('Logout all error:', error));
      }
    } else {
      // Use Alert.alert for mobile
      showAlert(
        t('Log Out From All Devices'),
        t('Do you want to log out from all devices logged in with this account?'),
        [
          {
            text: t('Cancel'),
            style: 'cancel',
          },
          {
            text: t('Log Out All'),
            style: 'destructive',
            onPress: async () => {
              try {
                const result = await logoutFromAllDevices();
                showAlert(t('Successful'), result.message, [
                  {
                    text: t('Ok'),
                    onPress: () => {
                      // Navigate to Welcome screen after showing alert
                      if (navigation.replace) {
                        navigation.replace('Welcome');
                      } else {
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'Welcome' }],
                        });
                      }
                    }
                  }
                ]);
              } catch (error) {
                showAlert(t('Error'), error.message || t('Unexpected error logging out from all devices'));
              }
            },
          },
        ]
      );
    }
  };

  // Force logout (clear local data without API call)
  const forceLogout = async () => {
    try {
      setIsLoggingOut(true);

      const result = await TokenManager.forceLogout();

      // Clear Redux state
      dispatch(setToken(null));

      // Navigate to Welcome screen
      if (navigation.replace) {
        navigation.replace('Welcome');
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
      }

      return result;
    } catch (error) {
      console.error('Force logout error:', error);
      throw error;
    } finally {
      setIsLoggingOut(false);
    }
  };

  return {
    logout,
    logoutWithConfirmation,
    logoutFromAllDevices,
    logoutFromAllDevicesWithConfirmation,
    forceLogout,
    isLoggingOut,
  };
};

export default useLogout;
