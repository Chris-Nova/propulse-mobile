import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { ThemedStatusBar } from '@/components/shared/ThemedStatusBar';
import { BottomGlow } from '@/components/splash/BottomGlow';
import { useMenu } from '@/components/menu/MenuContext';
import { useSettingsTheme } from '@/components/settings/parts';

export const goBackOrMore = () =>
  router.canGoBack() ? router.back() : router.replace('/(app)/more' as any);

interface ShellProps {
  title: string;
  /** Logo row above the title (the design omits it on Edit Profile). */
  showLogo?: boolean;
  /** Bigger title, as on Edit Profile. */
  large?: boolean;
  children: React.ReactNode;
  /** Pinned under the scrolling content, e.g. a Save button. */
  footer?: React.ReactNode;
}

// Common frame for the Settings sub-screens: status bar, dark-mode glow, logo row,
// "← Title" header, scrolling body and an optional pinned footer.
export const SettingsShell = ({ title, showLogo = true, large, children, footer }: ShellProps) => {
  const { theme } = useSettingsTheme();
  const insets = useSafeAreaInsets();
  const { openMenu } = useMenu();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ThemedStatusBar style={theme.statusBar} />
      {theme.glow && <BottomGlow color={BRAND_PURPLE} opacity={0.22} />}

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {showLogo && (
          <TouchableOpacity onPress={openMenu} activeOpacity={0.7} accessibilityLabel="Open menu" style={styles.logoBtn}>
            <Image source={require('../../assets/splash-logo.png')} style={styles.logo} resizeMode="contain" />
          </TouchableOpacity>
        )}

        <View style={[styles.header, !showLogo && { marginTop: 10 }]}>
          <TouchableOpacity
            onPress={goBackOrMore}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={large ? 24 : 22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[large ? styles.titleLarge : styles.title, { color: theme.text }]}>{title}</Text>
        </View>

        {children}
      </ScrollView>

      {footer && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>{footer}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 40 },
  logoBtn: { alignSelf: 'flex-start' },
  logo: { width: 94, height: 15 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 22, marginBottom: 20 },
  title: { fontSize: 16, fontWeight: '600' },
  titleLarge: { fontSize: 22, fontWeight: '700' },
  footer: { paddingHorizontal: 16, paddingTop: 8 },
});
