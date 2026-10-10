import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, useColorScheme, useWindowDimensions,
} from 'react-native';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppDispatch } from '@/store/hooks';
import { signInWithGoogle } from '@/store/slices/auth';
import { AUTH_FONT, BRAND_PURPLE } from '@/constants/authTheme';
import { BottomGlow } from '@/components/splash/BottomGlow';
import { GoogleLogo } from './GoogleLogo';

// Light: brand-purple screen with a white glow. Dark: black with a purple glow.
const THEMES = {
  light: { background: BRAND_PURPLE, glow: '#FFFFFF', googleBg: '#FFFFFF' },
  dark: { background: '#000000', glow: BRAND_PURPLE, googleBg: '#F4F2F7' },
};

const Welcome = () => {
  const dispatch = useAppDispatch();
  const theme = THEMES[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const { height } = useWindowDimensions();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* White status-bar icons read better on both the purple and black versions */}
      <StatusBar style="light" />
      <BottomGlow color={theme.glow} opacity={0.25} />

      <View style={[styles.content, { paddingBottom: height * 0.12 }]}>
        <Text style={[styles.title, { fontFamily: AUTH_FONT }]}>Welcome</Text>
        <Text style={[styles.subtitle, { fontFamily: AUTH_FONT }]}>
          Simple project clarity for your clients
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => dispatch(signInWithGoogle() as any)}
          style={[styles.googleBtn, { backgroundColor: theme.googleBg }]}
        >
          <View style={styles.googleIcon}>
            <GoogleLogo />
          </View>
          <Text style={[styles.googleText, { fontFamily: AUTH_FONT }]}>Sign in with Google</Text>
        </TouchableOpacity>

        <Link href="/(auth)/sign-up" asChild>
          <TouchableOpacity activeOpacity={0.85} style={styles.outlineBtn}>
            <Text style={[styles.outlineText, { fontFamily: AUTH_FONT }]}>Create an Account</Text>
          </TouchableOpacity>
        </Link>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { fontFamily: AUTH_FONT }]}>Already have an account? </Text>
          <Link href="/(auth)" asChild>
            <TouchableOpacity>
              <Text style={[styles.footerLink, { fontFamily: AUTH_FONT }]}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 22 },
  title: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginBottom: 22 },
  subtitle: { color: '#FFFFFF', fontSize: 15, marginBottom: 40 },
  googleBtn: {
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  googleIcon: { position: 'absolute', left: 32 },
  googleText: { color: '#111111', fontSize: 14 },
  outlineBtn: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: { color: '#FFFFFF', fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 28 },
  footerText: { color: 'rgba(255,255,255,0.9)', fontSize: 15 },
  footerLink: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

export default Welcome;
