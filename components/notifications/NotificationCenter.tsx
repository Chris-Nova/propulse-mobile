import React, { useCallback, useState } from 'react';
import {
  View, Text, Image, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { AppNotification, liveMessagesCleared } from '@/store/reducers/notifications';
import {
  fetchNotifications, fetchUnreadCount, markNotificationRead,
} from '@/store/slices/notifications';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { timeAgo } from '@/utils/format';
import { ThemedStatusBar } from '@/components/shared/ThemedStatusBar';
import { BottomGlow } from '@/components/splash/BottomGlow';
import { useMenu } from '@/components/menu/MenuContext';
import { goBackOrMore } from '@/components/settings/SettingsShell';
import { Card, IconCircle, IconName, useSettingsTheme } from '@/components/settings/parts';
import { NotificationBell } from '@/components/notifications/NotificationBell';

const CATEGORY_ICON: Record<string, IconName> = {
  messages: 'chatbubble-outline',
  projects: 'folder-outline',
  invitations: 'people-outline',
  billing: 'card-outline',
  system: 'notifications-outline',
};

// Where a notification leads, from what the backend puts in `metadata`.
const targetFor = (n: AppNotification): string | null => {
  const m = n.metadata ?? {};
  if (m.conversation_id) return `/(app)/messages/${m.conversation_id}`;
  if (Array.isArray(m.conversation_ids) && m.conversation_ids.length > 0) {
    return m.conversation_ids.length === 1 ? `/(app)/messages/${m.conversation_ids[0]}` : '/(app)/messages';
  }
  if (m.project_id) return `/(app)/projects/${m.project_id}`;
  if (n.category === 'invitations') return '/(app)/teams';
  return null;
};

export const NotificationCenter = () => {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { openMenu } = useMenu();
  const { theme } = useSettingsTheme();
  const { items, loading, loaded, hasMore, page, error } = useAppSelector((s) => s.notifications);
  const [refreshing, setRefreshing] = useState(false);

  // Load (and re-load) whenever the screen is shown
  useFocusEffect(
    useCallback(() => {
      dispatch(liveMessagesCleared());
      dispatch(fetchNotifications(1) as any);
      dispatch(fetchUnreadCount(true) as any);
    }, [dispatch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchNotifications(1) as any),
      dispatch(fetchUnreadCount(true) as any),
    ]);
    setRefreshing(false);
  };

  const onEndReached = () => {
    if (hasMore && !loading) dispatch(fetchNotifications(page + 1) as any);
  };

  const open = (n: AppNotification) => {
    if (!n.is_read) dispatch(markNotificationRead(n.id) as any);
    const target = targetFor(n);
    if (target) router.push(target as any);
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={() => open(item)} accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.body}${item.is_read ? '' : '. Unread'}`}>
      <Card style={styles.item}>
        <View style={styles.itemRow}>
          <IconCircle icon={CATEGORY_ICON[item.category] ?? 'notifications-outline'} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
            <Text style={[styles.itemBody, { color: theme.muted }]} numberOfLines={3}>{item.body}</Text>
          </View>
          <View style={styles.meta}>
            <Text style={[styles.time, { color: theme.muted }]}>{timeAgo(item.created_at)}</Text>
            {!item.is_read && <View style={styles.unreadDot} />}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const header = (
    <View>
      <TouchableOpacity onPress={openMenu} activeOpacity={0.7} accessibilityLabel="Open menu" style={styles.logoBtn}>
        <Image source={require('../../assets/splash-logo.png')} style={styles.logo} resizeMode="contain" />
      </TouchableOpacity>
      <View style={styles.titleRow}>
        <TouchableOpacity
          onPress={goBackOrMore}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Notification</Text>
        <View style={{ flex: 1 }} />
        {/* Already here: the bell just keeps its dot in sync */}
        <NotificationBell onPress={() => {}} />
      </View>
      <Text style={[styles.subtitle, { color: theme.muted }]}>Stay updated with the latest activity.</Text>
    </View>
  );

  let empty: React.ReactNode = null;
  if (!loaded && loading) {
    empty = <ActivityIndicator style={{ marginTop: 56 }} color={BRAND_PURPLE} />;
  } else if (error && items.length === 0) {
    empty = (
      <View style={styles.empty}>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>Couldn't load notifications</Text>
        <Text style={[styles.emptySub, { color: theme.muted }]}>{error}</Text>
        <TouchableOpacity onPress={onRefresh} activeOpacity={0.8} style={styles.retry} accessibilityRole="button">
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (loaded) {
    empty = (
      <View style={styles.empty}>
        <IconCircle icon="notifications-outline" size={60} />
        <Text style={[styles.emptyTitle, { color: theme.text, marginTop: 16 }]}>You're all caught up</Text>
        <Text style={[styles.emptySub, { color: theme.muted }]}>New activity will show up here.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ThemedStatusBar style={theme.statusBar} />
      {theme.glow && <BottomGlow color={BRAND_PURPLE} opacity={0.22} />}
      <FlatList
        data={items}
        keyExtractor={(n: AppNotification) => n.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          loading && loaded && items.length > 0 ? <ActivityIndicator style={{ marginVertical: 16 }} color={BRAND_PURPLE} /> : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND_PURPLE} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 40 },
  logoBtn: { alignSelf: 'flex-start' },
  logo: { width: 94, height: 15 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 22 },
  title: { fontSize: 17, fontWeight: '600' },
  subtitle: { fontSize: 12, marginTop: 8, marginLeft: 36, marginBottom: 20 },

  item: { paddingVertical: 16 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  itemTitle: { fontSize: 13.5, fontWeight: '600', lineHeight: 18 },
  itemBody: { fontSize: 10.5, lineHeight: 15, marginTop: 4 },
  meta: { alignItems: 'flex-end', minWidth: 58, gap: 8 },
  time: { fontSize: 10 },
  unreadDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: BRAND_PURPLE },

  empty: { alignItems: 'center', paddingTop: 64, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptySub: { fontSize: 12, textAlign: 'center', marginTop: 6 },
  retry: { marginTop: 18, borderRadius: 10, borderWidth: 1, borderColor: BRAND_PURPLE, paddingHorizontal: 22, paddingVertical: 9 },
  retryText: { color: BRAND_PURPLE, fontSize: 13, fontWeight: '600' },
});
