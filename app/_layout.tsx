import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import { store } from '@/store';
import { registerSignOutCallback } from '@/utils/api';
import { signOut } from '@/store/slices/auth';
import { FeedbackToast } from '@/components/shared/FeedbackToast';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // Register global sign-out for 401 errors
    registerSignOutCallback(() => {
      store.dispatch(signOut() as any);
    });
    SplashScreen.hideAsync();
  }, []);

  return (
    <Provider store={store}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="company/setup" options={{ title: 'Company Setup', headerShown: true }} />
        <Stack.Screen name="invite/[inviteId]" options={{ title: 'Accept Invite', headerShown: true }} />
        <Stack.Screen name="subscription/free-trial/index" options={{ title: 'Free Trial', headerShown: true }} />
        <Stack.Screen name="subscription/payment-method/index" options={{ title: 'Payment Method', headerShown: true }} />
        <Stack.Screen name="subscription/activate/[planName]/index" options={{ title: 'Subscribe', headerShown: true }} />
      </Stack>
      <FeedbackToast />
      <Toast />
    </Provider>
  );
}
