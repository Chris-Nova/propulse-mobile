import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { TokenStorage } from '@/utils/storage';
import { store } from '@/store';
import { setUser } from '@/store/reducers/account';
import { COLORS } from '@/constants/theme';

export default function Index() {
  useEffect(() => {
    const init = async () => {
      const token = await TokenStorage.getToken();
      if (!token) {
        router.replace('/(auth)/');
        return;
      }
      const user = await TokenStorage.getUser();
      if (user) {
        store.dispatch(setUser(user));
      }
      router.replace('/(app)/dashboard');
    };
    init();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}
