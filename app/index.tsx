import { useEffect } from 'react';
import { router } from 'expo-router';
import { TokenStorage } from '@/utils/storage';
import { store } from '@/store';
import { setUser } from '@/store/reducers/account';
import { SplashView } from '@/components/splash/SplashView';

// Show the branded splash for at least this long, even if auth restores faster,
// so the tagline has time to land instead of flashing past.
const MIN_SPLASH_MS = 1400;

export default function Index() {
  useEffect(() => {
    const init = async () => {
      const startedAt = Date.now();
      const token = await TokenStorage.getToken();

      if (token) {
        const user = await TokenStorage.getUser();
        if (user) {
          store.dispatch(setUser(user));
        }
      }

      const remaining = MIN_SPLASH_MS - (Date.now() - startedAt);
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      if (token) {
        router.replace('/(app)/dashboard');
      } else {
        router.replace('/(auth)/welcome');
      }
    };
    init();
  }, []);

  return <SplashView />;
}
