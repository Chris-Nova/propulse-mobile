import { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet, Easing, useColorScheme } from 'react-native';
import { BottomGlow } from './BottomGlow';

// Keep these in sync with the native splash config in app.json
// (expo-splash-screen: imageWidth 190) so the hand-off from the native
// splash to this view doesn't visibly jump.
const LOGO_WIDTH = 190;
const LOGO_ASPECT = 1200 / 182;
const BRAND_PURPLE = '#734BA9';

const THEMES = {
  light: {
    background: BRAND_PURPLE,
    glow: '#FFFFFF',
    tagline: '#FFFFFF',
    logo: require('../../assets/splash-logo-white.png'),
  },
  dark: {
    background: '#000000',
    glow: BRAND_PURPLE,
    tagline: 'rgba(255,255,255,0.9)',
    logo: require('../../assets/splash-logo.png'),
  },
};

export const SplashView = () => {
  const theme = THEMES[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(reveal, {
      toValue: 1,
      duration: 800,
      delay: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reveal]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: reveal }]} pointerEvents="none">
        <BottomGlow color={theme.glow} />
      </Animated.View>

      {/* Logo is static: the native splash already shows it at this exact spot */}
      <Image
        source={theme.logo}
        style={{ width: LOGO_WIDTH, height: LOGO_WIDTH / LOGO_ASPECT }}
        resizeMode="contain"
      />

      <Animated.Text style={[styles.tagline, { opacity: reveal, color: theme.tagline }]}>
        Manage Your Projects
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tagline: {
    position: 'absolute',
    top: '50%',
    marginTop: 34,
    fontSize: 15,
    fontWeight: '300',
    letterSpacing: 0.6,
  },
});
