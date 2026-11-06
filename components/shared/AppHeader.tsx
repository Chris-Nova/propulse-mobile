import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '@/store/hooks';
import { useDashboardTheme } from '@/constants/dashboardTheme';
import { initialOf } from '@/utils/format';
import { useMenu } from '@/components/menu/MenuContext';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { UserAvatar } from './UserAvatar';

// Top bar shared by Messages, Projects, Documents and Teams: logo (opens the menu),
// notifications bell and the account avatar.
export const AppHeader = () => {
  const theme = useDashboardTheme();
  const insets = useSafeAreaInsets();
  const { openMenu } = useMenu();
  const { user } = useAppSelector((s) => s.account);
  const first = user?.first_name ?? user?.name?.split(' ')[0] ?? '';

  return (
    <View style={[styles.row, { paddingTop: insets.top + 14 }]}>
      <TouchableOpacity onPress={openMenu} activeOpacity={0.7} accessibilityLabel="Open menu">
        <Image source={require('../../assets/splash-logo.png')} style={styles.logo} resizeMode="contain" />
      </TouchableOpacity>
      <View style={styles.right}>
        <NotificationBell />
        <TouchableOpacity onPress={() => router.push('/(app)/account' as any)} activeOpacity={0.8}>
          <UserAvatar key={user?.avatar ?? 'none'} uri={user?.avatar} initial={initialOf(first)} theme={theme} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: 94, height: 15 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 16 },
});
