import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchUnreadCount } from '@/store/slices/notifications';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { useDashboardTheme } from '@/constants/dashboardTheme';

export const NOTIFICATION_RED = '#EF3B30';

// Bell used in every header. The red dot shows only while there are unread
// notifications; pressing it opens the notifications list.
export const NotificationBell = ({ onPress }: { onPress?: () => void }) => {
  const dispatch = useAppDispatch();
  const theme = useDashboardTheme();
  const unread = useAppSelector((s) => s.notifications.unreadCount);

  // Re-check whenever the screen comes into view (throttled inside the thunk)
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchUnreadCount() as any);
    }, [dispatch])
  );

  return (
    <TouchableOpacity
      onPress={onPress ?? (() => router.push('/(app)/notifications' as any))}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
    >
      <View>
        <Ionicons name="notifications" size={22} color={BRAND_PURPLE} />
        {unread > 0 && <View style={[styles.dot, { borderColor: theme.background }]} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  dot: {
    position: 'absolute', top: -1, right: 0, width: 10, height: 10, borderRadius: 5,
    backgroundColor: NOTIFICATION_RED, borderWidth: 1.5,
  },
});
