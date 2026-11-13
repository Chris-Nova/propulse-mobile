import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchChats, deleteChat, refreshChatsIfStale, setMessagesScreenOpen } from '@/store/slices/chat';
import { liveMessagesCleared } from '@/store/reducers/notifications';
import { setActiveChatId } from '@/store/reducers/chat';
import { Chat, ChatFilters } from '@/types';
import { ThemedStatusBar } from '@/components/shared/ThemedStatusBar';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { useDashboardTheme } from '@/constants/dashboardTheme';
import { formatStamp, initialOf } from '@/utils/format';
import { AppHeader } from '@/components/shared/AppHeader';
import { SearchField, FilterPills, PageTitle } from '@/components/shared/ListControls';
import { BottomGlow } from '@/components/splash/BottomGlow';
import { setConversationPinned } from './pin';
import { LoadError, NoConversations } from './ChatStates';
import { NewConversationModal } from './NewConversation';

// ─── Chat List ─────────────────────────────────────────────
export const ChatList = () => {
  const dispatch = useAppDispatch();
  const theme = useDashboardTheme();
  const { chats, activeChatsFilter } = useAppSelector((s) => s.chat);
  const { user } = useAppSelector((s) => s.account);
  const { pending } = useAppSelector((s) => s.asyncActions.fetchChats);
  const insets = useSafeAreaInsets();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const loadChats = async () => {
    const ok = await dispatch(fetchChats(ChatFilters.ALL) as any);
    setLoadFailed(ok === false);
    setLoadedOnce(true);
  };

  useEffect(() => {
    loadChats();
  }, []);

  // Coming back to this tab: refresh unread badges (skipped if the list was just loaded)
  useFocusEffect(
    useCallback(() => {
      setMessagesScreenOpen(true);
      dispatch(liveMessagesCleared());
      dispatch(refreshChatsIfStale() as any);
      return () => setMessagesScreenOpen(false);
    }, [dispatch])
  );

  const getOtherParticipant = (chat: Chat) =>
    chat.participants?.find((p) => p.id !== user?.id) ?? chat.participants?.[0];

  const nameOf = (chat: Chat) =>
    chat.room?.name ?? getOtherParticipant(chat)?.name ?? 'Unknown';

  // Pinned (starred) conversations first, then newest activity
  const chatList = Object.values(chats)
    .filter((c) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return nameOf(c).toLowerCase().includes(q) || (c.last_message?.text ?? '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const pa = (a as any).is_pinned ? 1 : 0;
      const pb = (b as any).is_pinned ? 1 : 0;
      if (pa !== pb) return pb - pa;
      return (b.last_message?.created_at ?? '').localeCompare(a.last_message?.created_at ?? '');
    });

  const palette = [theme.palette.lavender, theme.palette.mint, theme.palette.blue, theme.palette.pink];
  const tintFor = (id: string) => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return palette[h % palette.length];
  };

  const openActions = (chat: Chat) => {
    const pinned = !!(chat as any).is_pinned;
    Alert.alert(nameOf(chat), undefined, [
      {
        text: pinned ? 'Unstar' : 'Star',
        onPress: () => dispatch(setConversationPinned(chat.id, !pinned) as any),
      },
      {
        text: 'Delete conversation',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete conversation', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteChat(chat.id) as any) },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const filterOptions = [
    { label: 'All', value: ChatFilters.ALL },
    { label: 'Direct Message', value: ChatFilters.DIRECT_MESSAGE },
    { label: 'Unread', value: ChatFilters.UNREAD },
    { label: 'Room', value: ChatFilters.ROOM },
  ];

  // Nothing to list at all (all filter, no search): show the empty / connection-error screen
  const emptyMode =
    loadedOnce &&
    Object.keys(chats).length === 0 &&
    (activeChatsFilter ?? ChatFilters.ALL) === ChatFilters.ALL &&
    !search.trim();

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ThemedStatusBar style={theme.statusBar} />
      {theme.glow && <BottomGlow color={BRAND_PURPLE} opacity={0.22} />}
      <FlatList
        data={chatList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.screenList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          emptyMode ? (
            // No conversations at all: just the title and search, as in the design
            <View style={{ paddingTop: insets.top + 28 }}>
              <PageTitle title="Messages" />
              <View style={{ marginTop: 18 }}>
                <SearchField value={search} onChangeText={setSearch} placeholder="Search messages..." />
              </View>
            </View>
          ) : (
            <View>
              <AppHeader />
              <View style={styles.titleRow}>
                <PageTitle title="Messages" />
                <TouchableOpacity
                  onPress={() => setShowModal(true)}
                  style={[styles.composeBtn, { backgroundColor: theme.field }]}
                  accessibilityLabel="New conversation"
                >
                  <Ionicons name="create-outline" size={20} color={BRAND_PURPLE} />
                </TouchableOpacity>
              </View>
              <View style={{ marginTop: 18 }}>
                <SearchField value={search} onChangeText={setSearch} placeholder="Search" />
              </View>
              <View style={{ marginTop: 14, marginBottom: 16 }}>
                <FilterPills
                  options={filterOptions}
                  value={(activeChatsFilter ?? ChatFilters.ALL) as ChatFilters}
                  onChange={(f) => dispatch(fetchChats(f) as any)}
                />
              </View>
              <View style={[styles.hairline, { backgroundColor: theme.divider }]} />
            </View>
          )
        }
        ListEmptyComponent={
          pending ? (
            emptyMode ? (
              <ActivityIndicator style={{ marginTop: 80 }} color={BRAND_PURPLE} />
            ) : (
              <Text style={[styles.empty, { color: theme.muted }]}>Loading conversations…</Text>
            )
          ) : emptyMode ? (
            loadFailed ? (
              <LoadError onRetry={loadChats} />
            ) : (
              <NoConversations onStart={() => setShowModal(true)} />
            )
          ) : (
            <Text style={[styles.empty, { color: theme.muted }]}>
              {search ? 'No conversations match your search.' : 'No conversations in this view.'}
            </Text>
          )
        }
        renderItem={({ item }) => {
          const name = nameOf(item);
          const tint = tintFor(item.id);
          const lastMsg = item.last_message;
          const unreadCount = item.unread_count ?? 0;
          const pinned = !!(item as any).is_pinned;
          return (
            <TouchableOpacity
              onPress={() => {
                dispatch(setActiveChatId(item.id));
                router.push(`/(app)/messages/${item.id}` as any);
              }}
              activeOpacity={0.7}
              style={[styles.msgRow, { borderBottomColor: theme.divider }]}
            >
              <View style={[styles.rowAvatar, { backgroundColor: tint.bg }]}>
                <Text style={{ color: tint.icon, fontSize: 15, fontWeight: '600' }}>{initialOf(name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.msgName, { color: theme.text }, unreadCount > 0 && { fontWeight: '800' }]} numberOfLines={2}>
                  {name}
                </Text>
                <Text style={[styles.msgPreview, { color: theme.muted }]} numberOfLines={1}>
                  {lastMsg?.is_deleted ? 'This message was deleted' : (lastMsg?.text ?? 'No messages yet')}
                </Text>
              </View>
              <View style={styles.msgRight}>
                <View style={styles.msgIcons}>
                  <TouchableOpacity
                    onPress={() => dispatch(setConversationPinned(item.id, !pinned) as any)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel={pinned ? 'Unstar conversation' : 'Star conversation'}
                  >
                    <Ionicons
                      name={pinned ? 'star' : 'star-outline'}
                      size={14}
                      color={pinned ? theme.accent : theme.placeholder}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => openActions(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="More actions"
                  >
                    <Ionicons name="ellipsis-vertical" size={14} color={theme.muted} />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {unreadCount > 0 && (
                    <View style={styles.msgBadge}>
                      <Text style={styles.msgBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                    </View>
                  )}
                  {!!lastMsg && <Text style={[styles.msgTime, { color: theme.muted }]}>{formatStamp(lastMsg.created_at)}</Text>}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <NewConversationModal visible={showModal} onClose={() => setShowModal(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenList: { paddingHorizontal: 16, paddingBottom: 28 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  composeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  hairline: { height: StyleSheet.hairlineWidth },
  empty: { textAlign: 'center', fontSize: 13, marginTop: 40, paddingHorizontal: 24 },
  msgRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 4,
  },
  rowAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  msgName: { fontSize: 14, fontWeight: '600', lineHeight: 18 },
  msgPreview: { fontSize: 10.5, marginTop: 3 },
  msgRight: { alignItems: 'flex-end', gap: 8 },
  msgIcons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  msgTime: { fontSize: 9.5 },
  msgBadge: {
    minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 5,
    backgroundColor: BRAND_PURPLE, alignItems: 'center', justifyContent: 'center',
  },
  msgBadgeText: { color: '#FFFFFF', fontSize: 9.5, fontWeight: '700' },
});
