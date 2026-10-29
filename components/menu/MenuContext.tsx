import React, { createContext, useCallback, useContext, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Alert, Image,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { signOut } from '@/store/slices/auth';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { useDashboardTheme } from '@/constants/dashboardTheme';
import { initialOf } from '@/utils/format';
import { UserAvatar } from '@/components/shared/UserAvatar';

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

const MenuModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const dispatch = useAppDispatch();
  const theme = useDashboardTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAppSelector((s) => s.account);
  const light = theme.scheme === 'light';
  const name = user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Account';

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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <StatusBar style={light ? 'light' : 'light'} />

        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header: purple gradient with the rounded bottom-left corner */}
          <View style={[styles.header, { height: insets.top + 150 }]}>
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
            <View style={[styles.headerRow, { paddingTop: insets.top + 26 }]}>
              <Image
                source={require('../../assets/splash-logo-white.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close menu"
              >
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Body overlaps the header by 50pt. It sits in the same scroll content as the
              header, so the profile card is never clipped. */}
          <View style={styles.body}>
            <View
              style={[
                styles.profile,
                { backgroundColor: light ? '#FFFFFF' : '#15121C', borderColor: theme.cardBorder },
                light && styles.profileShadow,
              ]}
            >
              <UserAvatar
                uri={user?.avatar}
                initial={initialOf(name)}
                theme={{ ...theme, avatarBg: BRAND_PURPLE, avatarText: '#FFFFFF' }}
                size={54}
                fontSize={22}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{name}</Text>
                {!!user?.role && (
                  <Text style={[styles.role, { color: theme.muted }]}>{humanize(user.role)}</Text>
                )}
              </View>
            </View>

            {ITEMS.map((item) => (
              <TouchableOpacity key={item.label} onPress={() => go(item.route)} style={styles.row} activeOpacity={0.6}>
                <Ionicons name={item.icon as any} size={22} color={light ? BRAND_PURPLE : theme.tabBar.active} />
                <Text style={[styles.label, { color: theme.text }]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={15} color={light ? '#909090' : theme.muted} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity onPress={confirmLogOut} style={styles.row} activeOpacity={0.6}>
              <Ionicons name="log-out-outline" size={22} color="#E33629" />
              <Text style={[styles.label, { color: '#E33629' }]}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

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
  header: { borderBottomLeftRadius: 96, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28 },
  logo: { width: 126, height: 19 },
  body: { marginTop: -50, paddingHorizontal: 20, zIndex: 1 },
  profile: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    borderRadius: 16, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 16,
  },
  profileShadow: {
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  name: { fontSize: 15, fontWeight: '600' },
  role: { fontSize: 10.5, marginTop: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 20, height: 62, paddingHorizontal: 10 },
  label: { flex: 1, fontSize: 15, fontWeight: '600' },
});
