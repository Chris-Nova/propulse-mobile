import React, { createContext, useCallback, useContext, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, Switch,
  Platform, StatusBar as RNStatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { signOut } from '@/store/slices/auth';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { useDashboardTheme } from '@/constants/dashboardTheme';
import { setColorSchemePreference } from '@/utils/appearance';
import { initialOf } from '@/utils/format';

interface MenuApi { openMenu: () => void; closeMenu: () => void }
const MenuContext = createContext<MenuApi>({ openMenu: () => {}, closeMenu: () => {} });
export const useMenu = () => useContext(MenuContext);

const ITEMS = [
  { label: 'Home', icon: 'home-outline', route: '/(app)/dashboard' },
  { label: 'Projects', icon: 'folder-outline', route: '/(app)/projects' },
  { label: 'Team', icon: 'people-outline', route: '/(app)/teams' },
  { label: 'Documents', icon: 'document-text-outline', route: '/(app)/documents' },
  { label: 'Analytics', icon: 'bar-chart-outline', route: '/(app)/analytics' },
  { label: 'Settings', icon: 'settings-outline', route: '/(app)/account' },
] as const;

const humanize = (s?: string) =>
  s ? s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '';

// Round avatar with the design's light-to-deep purple gradient and a white initial.
// A real photo, if there is one, is layered on top; otherwise the initial stays.
const GradientAvatar = ({ uri, initial, size = 54 }: { uri?: string; initial: string; size?: number }) => {
  const [failed, setFailed] = useState(false);
  const showPhoto = !!uri && /^https?:\/\//i.test(uri) && !failed;
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2, overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Svg style={StyleSheet.absoluteFill} width={size} height={size}>
        <Defs>
          <LinearGradient id="avatarGrad" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor="#CDB9EA" />
            <Stop offset="1" stopColor="#7B52AE" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={size} height={size} fill="url(#avatarGrad)" />
      </Svg>
      <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700' }}>{initial}</Text>
      {showPhoto && (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} onError={() => setFailed(true)} />
      )}
    </View>
  );
};

const MenuSheet = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useAppDispatch();
  const theme = useDashboardTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAppSelector((s) => s.account);
  const light = theme.scheme === 'light';
  const name = user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Account';
  // Inside a Modal on Android the safe-area inset can read 0, which put the logo up against
  // the status bar; fall back to the status bar's own height.
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 0);
  const iconColor = light ? BRAND_PURPLE : theme.tabBar.active;

  const go = (route: string) => {
    onClose();
    router.push(route as any);
  };

  const confirmLogOut = () =>
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: () => { onClose(); dispatch(signOut() as any); },
      },
    ]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false} bounces={false}>
        {/* Header: purple gradient with the rounded bottom-left corner */}
        <View style={[styles.header, { height: topInset + 150 }]}>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id="menuGrad" x1="0" y1="1" x2="1" y2="0">
                <Stop offset="0" stopColor="#734BA9" />
                <Stop offset="0.5" stopColor="#7F55B8" />
                <Stop offset="1" stopColor="#A271E5" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#menuGrad)" />
          </Svg>
          <View style={[styles.headerRow, { paddingTop: topInset + 30 }]}>
            <Image source={require('../../assets/splash-logo-white.png')} style={styles.logo} resizeMode="contain" />
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Close menu"
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Body overlaps the header by 50pt and shares its scroll content, so nothing is clipped */}
        <View style={styles.body}>
          <View
            style={[
              styles.profile,
              { backgroundColor: light ? '#FFFFFF' : '#15121C', borderColor: theme.cardBorder },
              light && styles.profileShadow,
            ]}
          >
            <GradientAvatar uri={user?.avatar} initial={initialOf(name)} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{name}</Text>
              {!!user?.role && <Text style={[styles.role, { color: theme.muted }]}>{humanize(user.role)}</Text>}
            </View>
          </View>

          {ITEMS.map((item) => (
            <TouchableOpacity key={item.label} onPress={() => go(item.route)} style={styles.row} activeOpacity={0.6}>
              <Ionicons name={item.icon as any} size={22} color={iconColor} />
              <Text style={[styles.label, { color: theme.text }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={15} color={light ? '#909090' : theme.muted} />
            </TouchableOpacity>
          ))}

          {/* Dark mode switch: overrides the phone's setting for the whole app and is remembered */}
          <View style={styles.row}>
            <Ionicons name="moon-outline" size={22} color={iconColor} />
            <Text style={[styles.label, { color: theme.text }]}>Dark mode</Text>
            <Switch
              value={!light}
              onValueChange={(on) => setColorSchemePreference(on ? 'dark' : 'light')}
              trackColor={{ false: light ? '#D9D9DE' : '#3A3A3C', true: BRAND_PURPLE }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={light ? '#D9D9DE' : '#3A3A3C'}
              accessibilityLabel="Dark mode"
            />
          </View>

          <TouchableOpacity onPress={confirmLogOut} style={styles.row} activeOpacity={0.6}>
            <Ionicons name="log-out-outline" size={22} color="#E33629" />
            <Text style={[styles.label, { color: '#E33629' }]}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const MenuModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => (
  <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
    {/* A Modal is its own window, so it needs its own safe-area provider */}
    <SafeAreaProvider>
      <MenuSheet onClose={onClose} />
    </SafeAreaProvider>
  </Modal>
);

export const MenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const openMenu = useCallback(() => setOpen(true), []);
  const closeMenu = useCallback(() => setOpen(false), []);
  return (
    <MenuContext.Provider value={{ openMenu, closeMenu }}>
      {children}
      <MenuModal visible={open} onClose={closeMenu} />
    </MenuContext.Provider>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { borderBottomLeftRadius: 30, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28 },
  logo: { width: 104, height: 16 },
  body: { marginTop: -50, paddingHorizontal: 20, zIndex: 1 },
  profile: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 14,
  },
  profileShadow: {
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  name: { fontSize: 14.5, fontWeight: '700' },
  role: { fontSize: 10, marginTop: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 20, height: 56, paddingHorizontal: 10 },
  label: { flex: 1, fontSize: 15, fontWeight: '600' },
});
