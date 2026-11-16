import { NavigationContainer } from '@react-navigation/native';
import { isRunningInExpoGo } from 'expo';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { I18nextProvider } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthInitializer from '@components/AuthInitializer';
import RealtimeProvider from '@components/RealtimeProvider';
import PushNotificationProvider from '@components/PushNotificationProvider';
import SessionExpiredSheet from '@components/SessionExpiredSheet';
import { MenuProvider } from '@contexts/MenuContext';
import { setNavigationRef } from '@services/axiosConfig';

import i18n from './i18n';
import NavigationFallback from './navigation/NavigationFallback';
import linking from './navigation/linking';
import RootNavigator from './navigation/RootNavigator';
import useExitConfirmation from './navigation/useExitConfirmation';
import store from './store';
import { removeToken } from '@slices/authSlice';
import { emptyUser } from '@slices/userSlice';
import { clearOrganizationData } from '@slices/organizationSlice';
import { clearOrders } from '@slices/ordersSlice';

async function expireCustomerSession(rejectedToken, navigation) {
  const { token, userType } = store.getState().auth;
  if (!token || token !== rejectedToken) return;

  // Clear Redux first so concurrent 401 responses for this token are ignored.
  store.dispatch(removeToken());
  store.dispatch(emptyUser());
  store.dispatch(clearOrganizationData());
  store.dispatch(clearOrders());

  let accountType = userType;
  try {
    const [[, storedType], [, storedToken]] = await AsyncStorage.multiGet(['accountType', 'userToken']);
    if (store.getState().auth.token || (storedToken && storedToken !== rejectedToken)) return;
    accountType ||= storedType;
    await AsyncStorage.multiRemove([
      'userToken', 'user_data', 'sessionToken', 'sessionUserData',
      'accountType', 'userType', 'organizationData', 'organizationCode',
    ]);
  } catch (error) {
    console.warn('Unable to clear expired customer session:', error?.message);
  }

  if (!store.getState().auth.token) {
    const login = accountType === 'organization' ? 'Login' : 'LoginScreen';
    navigation?.resetRoot?.({ index: 0, routes: [{ name: login }] });
  }
}

/**
 * Persian font faces. These four keys are the *only* registered families —
 * a hyphenated `'Vazir-Bold'` is not one of them and silently falls back to
 * the system font, so always go through `getFontFamily()` in `theme/Typography`
 * rather than writing a family name by hand.
 */
const FONTS = {
  VazirBold: require('@assets/fonts/Vazirmatn-Bold.ttf'),
  VazirLight: require('@assets/fonts/Vazirmatn-Light.ttf'),
  VazirBoldFD: require('@assets/fonts/Vazir-Bold-FD.ttf'),
  VazirLightFD: require('@assets/fonts/Vazir-Light-FD.ttf'),
};

SplashScreen.preventAutoHideAsync();
// Splash-screen customisation needs a development build; calling it in Expo Go
// only logs a warning on every start.
if (!isRunningInExpoGo()) SplashScreen.setOptions({ duration: 2000, fade: true });

const documentTitle = {
  formatter: (options, route) => `لوپ - ${route?.name ?? 'خانه'}`,
};

const App = () => {
  const navigationRef = useRef(null);
  const [fontsLoaded, fontError] = useFonts(FONTS);

  useExitConfirmation(navigationRef);

  // The axios error interceptor needs a way to redirect to the login screen.
  useEffect(() => {
    setNavigationRef(navigationRef, expireCustomerSession);
    return () => setNavigationRef(null);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  // Hold the splash screen until the fonts resolve one way or the other.
  // On failure we still render: a missing font is worse-looking, not fatal.
  if (!fontsLoaded && !fontError) return null;

  return (
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <SafeAreaProvider>
          <NavigationContainer
            ref={navigationRef}
            linking={linking}
            documentTitle={documentTitle}
            fallback={<NavigationFallback />}
          >
            <AuthInitializer>
              <RealtimeProvider>
              <PushNotificationProvider>
                <MenuProvider>
                  <RootNavigator />
                  {/* Sits above every screen: an expired session can surface
                      anywhere, and the sheet drives the navigator itself. */}
                  <SessionExpiredSheet />
                </MenuProvider>
              </PushNotificationProvider>
              </RealtimeProvider>
            </AuthInitializer>
          </NavigationContainer>
        </SafeAreaProvider>
      </I18nextProvider>
    </Provider>
  );
};

export default App;
