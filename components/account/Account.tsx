import React, { useEffect } from 'react';
import { View, Text, Image, Alert, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUserProfile } from '@/store/slices/teams';
import { signOut } from '@/store/slices/auth';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { initialOf } from '@/utils/format';
import { ThemedStatusBar } from '@/components/shared/ThemedStatusBar';
import { GradientAvatar } from '@/components/shared/GradientAvatar';
import { BottomGlow } from '@/components/splash/BottomGlow';
import { goBackOrMore } from '@/components/settings/SettingsShell';
import { Card, Gap, Row, useSettingsTheme } from '@/components/settings/parts';

const titleCase = (s?: string) =>
  s ? s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : '';

// Settings hub: profile card plus a menu. Each row opens its own screen.
export const Account = () => {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { theme, light, accent } = useSettingsTheme();
  const { user } = useAppSelector((s) => s.account);

  useEffect(() => {
    dispatch(fetchUserProfile() as any);
  }, [dispatch]);

  const name =
    user?.name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'Your account';

  const go = (path: string) => router.push(path as any);
  const confirmLogOut = () =>
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => dispatch(signOut() as any) },
    ]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* The banner is purple in both modes, so the status bar icons stay light */}
      <ThemedStatusBar style="light" />
      {theme.glow && <BottomGlow color={BRAND_PURPLE} opacity={0.22} />}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <LinearGradient
          colors={['#6A42A2', '#A374E8']}
          start={{ x: 0, y: 0.3 }}
          end={{ x: 1, y: 0.7 }}
          style={[styles.banner, { paddingTop: insets.top + 24 }]}
        >
          <View style={styles.bannerRow}>
            <Image source={require('../../assets/splash-logo-white.png')} style={styles.logo} resizeMode="contain" />
            <TouchableOpacity
              onPress={goBackOrMore}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Profile card, overlapping the banner */}
        <View style={styles.pad}>
          <Card style={styles.profileCard}>
            <View style={styles.profileRow}>
              <GradientAvatar uri={user?.avatar} initial={initialOf(name)} size={52} fontSize={21} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{name}</Text>
                {!!user?.role && (
                  <Text style={[styles.role, { color: theme.muted }]} numberOfLines={1}>{titleCase(user.role)}</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => go('/(app)/account/edit-profile')}
                activeOpacity={0.7}
                style={[styles.editPill, { borderColor: accent }]}
                accessibilityRole="button"
              >
                <Text style={[styles.editText, { color: accent }]}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </Card>

          <Gap h={22} />
          <Card>
            <Row
              big
              icon="person-outline"
              title="Profile"
              subtitle="Update your personal and company details"
              onPress={() => go('/(app)/account/edit-profile')}
            />
          </Card>
          <Gap h={8} />
          
          <Card>
            <Row
              big
              icon="shield-checkmark-outline"
              title="Security"
              subtitle="Manage your password and account security"
              onPress={() => go('/(app)/account/security')}
            />
          </Card>
          
          <Gap h={8} />
          <Card>
            <Row
              big
              icon="options-outline"
              title="Preferences"
              subtitle="Customize your app experience"
              onPress={() => go('/(app)/account/preferences')}
            />
          </Card>
          <Gap h={8} />
          <Card>
            <Row
              big
              icon="notifications-outline"
              title="Notifications"
              subtitle="Manage your notification settings"
              onPress={() => go('/(app)/account/notifications')}
            />
          </Card>

          <TouchableOpacity
            onPress={confirmLogOut}
            activeOpacity={0.8}
            style={[styles.logout, { backgroundColor: light ? '#FCEAEA' : 'rgba(239,68,68,0.14)' }]}
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={22} color={light ? '#E33629' : '#FF8A80'} />
            <Text style={[styles.logoutText, { color: light ? '#E33629' : '#FF8A80' }]}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  banner: { paddingHorizontal: 22, paddingBottom: 92, borderBottomLeftRadius: 30 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 132, height: 20 },
  pad: { paddingHorizontal: 16 },
  profileCard: { marginTop: -58, paddingVertical: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { fontSize: 14, fontWeight: '600' },
  role: { fontSize: 10.5, marginTop: 4 },
  editPill: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 },
  editText: { fontSize: 10.5, fontWeight: '600' },
  logout: {
    height: 52, borderRadius: 10, marginTop: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  logoutText: { fontSize: 14, fontWeight: '600' },
});
