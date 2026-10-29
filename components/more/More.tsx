import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch } from '@/store/hooks';
import { signOut } from '@/store/slices/auth';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { useDashboardTheme } from '@/constants/dashboardTheme';
import { PRIVACY_URL, SUPPORT_EMAIL, TERMS_URL } from '@/constants/links';
import { BottomGlow } from '@/components/splash/BottomGlow';

type Row = { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void };

export const More = () => {
  const dispatch = useAppDispatch();
  const theme = useDashboardTheme();
  const insets = useSafeAreaInsets();
  const light = theme.scheme === 'light';

  const open = (url: string) => Linking.openURL(url).catch(() => {});

  const rows: Row[] = [
    { label: 'Documents', icon: 'document-text-outline', onPress: () => router.push('/(app)/documents' as any) },
    { label: 'Analytics', icon: 'bar-chart-outline', onPress: () => router.push('/(app)/analytics' as any) },
    { label: 'Settings', icon: 'settings-outline', onPress: () => router.push('/(app)/account' as any) },
    { label: 'Help & Support', icon: 'help-circle-outline', onPress: () => open(`mailto:${SUPPORT_EMAIL}`) },
    { label: 'Privacy Policy', icon: 'shield-checkmark-outline', onPress: () => open(PRIVACY_URL) },
    { label: 'Terms of Service', icon: 'clipboard-outline', onPress: () => open(TERMS_URL) },
  ];

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(app)/dashboard' as any));

  const confirmLogOut = () =>
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => dispatch(signOut() as any) },
    ]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBar} />
      {theme.glow && <BottomGlow color={BRAND_PURPLE} opacity={0.22} />}

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={goBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>More</Text>
        </View>

        {/* Menu */}
        <View style={styles.list}>
          {rows.map((r) => (
            <TouchableOpacity key={r.label} onPress={r.onPress} activeOpacity={0.6} style={styles.row}>
              <Ionicons name={r.icon} size={22} color={light ? BRAND_PURPLE : theme.tabBar.active} />
              <Text style={[styles.label, { color: theme.text }]}>{r.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={light ? '#909090' : theme.muted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flex: 1, minHeight: 28 }} />

        <TouchableOpacity
          onPress={confirmLogOut}
          activeOpacity={0.8}
          style={[
            styles.logout,
            light
              ? { backgroundColor: '#FDD7D9', borderColor: '#EA685E' }
              : { backgroundColor: 'rgba(239,68,68,0.16)', borderColor: 'rgba(248,113,113,0.7)' },
          ]}
        >
          <Text style={[styles.logoutText, { color: light ? '#E33629' : '#FF8A80' }]}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 44 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginLeft: 8 },
  title: { fontSize: 22, fontWeight: '700' },
  list: { marginTop: 36 },
  row: { flexDirection: 'row', alignItems: 'center', height: 63, paddingLeft: 30, paddingRight: 28 },
  label: { flex: 1, fontSize: 15, fontWeight: '600', marginLeft: 22 },
  logout: {
    height: 36, marginHorizontal: 25, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  logoutText: { fontSize: 12, fontWeight: '500' },
});
