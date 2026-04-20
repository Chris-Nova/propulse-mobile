import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Modal,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchChats, fetchMessages, sendMessage, createChat,
  connectSocket, disconnectSocket,
} from '@/store/slices/chat';
import { fetchTeamMembers } from '@/store/slices/teams';
import { setActiveChatId, updateMessageText } from '@/store/reducers/chat';
import { EmptyState, Loader, SectionHeader } from '@/components/shared';
import { COLORS, SIZES } from '@/constants/theme';
import { Chat, ChatMessage, TeamMember } from '@/types';

// ─── Helpers ──────────────────────────────────────────────
const formatTime = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const Avatar = ({ name, size = 44 }: { name: string; size?: number }) => (
  <View style={[styles.avatarCircle, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>
      {name?.charAt(0)?.toUpperCase() ?? '?'}
    </Text>
  </View>
);

// ─── New Conversation Modal ────────────────────────────────
const NewConversationModal = ({
  visible, onClose,
}: { visible: boolean; onClose: () => void }) => {
  const dispatch = useAppDispatch();
  const { members } = useAppSelector((s) => s.team);
  const { user } = useAppSelector((s) => s.account);
  const { pending } = useAppSelector((s) => s.asyncActions.createChat);

  const [tab, setTab] = useState<'direct' | 'group'>('direct');
  const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([]);
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (visible) {
      dispatch(fetchTeamMembers() as any);
      setSelectedMembers([]);
      setGroupName('');
      setSearch('');
    }
  }, [visible]);

  const filtered = members.filter((m) =>
    m.user_id !== user?.id &&
    (m.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.user_email?.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleMember = (member: TeamMember) => {
    if (tab === 'direct') {
      setSelectedMembers([member]);
    } else {
      setSelectedMembers((prev) =>
        prev.find((m) => m.user_id === member.user_id)
          ? prev.filter((m) => m.user_id !== member.user_id)
          : [...prev, member]
      );
    }
  };

  const handleCreate = async () => {
    if (!user) return;

    let body: any;

    if (tab === 'direct') {
      if (!selectedMembers[0]) return;
      // Direct message: participants must include current user + other user
      body = {
        participants: [
          { id: user.id, email: user.email, name: user.first_name ? `${user.first_name} ${user.last_name ?? ''}`.trim() : user.email },
          { id: selectedMembers[0].user_id, email: selectedMembers[0].user_email, name: selectedMembers[0].user_name },
        ],
      };
    } else {
      if (!groupName.trim() || selectedMembers.length === 0) return;
      // Group chat: room object + participants (no need to include self)
      body = {
        participants: selectedMembers.map((m) => ({
          id: m.user_id,
          email: m.user_email,
          name: m.user_name,
        })),
        room: { name: groupName.trim() },
      };
    }

    const result = await dispatch(createChat(body) as any);
    if (result) {
      onClose();
    }
  };

  const canCreate = tab === 'direct'
    ? selectedMembers.length === 1
    : selectedMembers.length >= 1 && groupName.trim().length > 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>New Conversation</Text>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={!canCreate || pending}
            style={[styles.createBtn, (!canCreate || pending) && styles.createBtnDisabled]}
          >
            {pending
              ? <ActivityIndicator size="small" color={COLORS.white} />
              : <Text style={styles.createBtnText}>Create</Text>}
          </TouchableOpacity>
        </View>

        {/* Tab Switch */}
        <View style={styles.tabRow}>
          {(['direct', 'group'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => { setTab(t); setSelectedMembers([]); }}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            >
              <Ionicons
                name={t === 'direct' ? 'person-outline' : 'people-outline'}
                size={16}
                color={tab === t ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
                {t === 'direct' ? 'Direct Message' : 'Group Chat'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Group name input */}
        {tab === 'group' && (
          <View style={styles.groupNameRow}>
            <Ionicons name="chatbubbles-outline" size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.groupNameInput}
              placeholder="Group name..."
              placeholderTextColor={COLORS.textMuted}
              value={groupName}
              onChangeText={setGroupName}
            />
          </View>
        )}

        {/* Selected chips */}
        {selectedMembers.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedRow}>
            {selectedMembers.map((m) => (
              <TouchableOpacity
                key={m.user_id}
                onPress={() => toggleMember(m)}
                style={styles.chip}
              >
                <Text style={styles.chipText}>{m.user_name}</Text>
                <Ionicons name="close-circle" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Member list */}
        <FlatList
          data={filtered}
          keyExtractor={(m) => m.user_id}
          contentContainerStyle={{ padding: SIZES.md, gap: SIZES.sm }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {members.length === 0 ? 'No team members found' : 'No results'}
            </Text>
          }
          renderItem={({ item }) => {
            const isSelected = !!selectedMembers.find((m) => m.user_id === item.user_id);
            return (
              <TouchableOpacity
                onPress={() => toggleMember(item)}
                style={[styles.memberRow, isSelected && styles.memberRowSelected]}
                activeOpacity={0.7}
              >
                <Avatar name={item.user_name} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{item.user_name}</Text>
                  <Text style={styles.memberEmail} numberOfLines={1}>{item.user_email}</Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
};

// ─── Chat List ─────────────────────────────────────────────
export const ChatList = () => {
  const dispatch = useAppDispatch();
  const { chats } = useAppSelector((s) => s.chat);
  const { user } = useAppSelector((s) => s.account);
  const { pending } = useAppSelector((s) => s.asyncActions.fetchChats);
  const [showModal, setShowModal] = useState(false);

  const chatList = Object.values(chats).sort((a, b) => {
    const aTime = a.last_message?.created_at ?? '';
    const bTime = b.last_message?.created_at ?? '';
    return bTime.localeCompare(aTime);
  });

  useEffect(() => {
    dispatch(fetchChats() as any);
    dispatch(connectSocket() as any);
    return () => { dispatch(disconnectSocket() as any); };
  }, []);

  const getOtherParticipant = (chat: Chat) =>
    chat.participants?.find((p) => p.id !== user?.id) ?? chat.participants?.[0];

  if (pending && !chatList.length) return <Loader pending fullScreen />;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={chatList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Messages</Text>
            <TouchableOpacity onPress={() => setShowModal(true)} style={styles.newBtn}>
              <Ionicons name="create-outline" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="No conversations yet"
            message="Tap the compose icon to start a new chat"
          />
        }
        renderItem={({ item }) => {
          const isGroup = !!item.room;
          const other = isGroup ? null : getOtherParticipant(item);
          const name = item.room?.name ?? other?.name ?? 'Unknown';
          const lastMsg = item.last_message;
          const isUnread = lastMsg && lastMsg.status !== 'read';

          return (
            <TouchableOpacity
              onPress={() => {
                dispatch(setActiveChatId(item.id));
                router.push(`/(app)/messages/${item.id}` as any);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.chatRow}>
                <View style={styles.avatarWrapper}>
                  <Avatar name={name} size={48} />
                  {isGroup && (
                    <View style={styles.groupBadge}>
                      <Ionicons name="people" size={10} color={COLORS.white} />
                    </View>
                  )}
                </View>
                <View style={styles.chatInfo}>
                  <View style={styles.chatMeta}>
                    <Text style={[styles.chatName, isUnread && styles.chatNameUnread]} numberOfLines={1}>
                      {name}
                    </Text>
                    {lastMsg && (
                      <Text style={styles.chatTime}>{formatTime(lastMsg.created_at)}</Text>
                    )}
                  </View>
                  <Text style={[styles.lastMessage, isUnread && styles.lastMessageUnread]} numberOfLines={1}>
                    {lastMsg?.text ?? 'No messages yet'}
                  </Text>
                </View>
                {isUnread && <View style={styles.unreadDot} />}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <NewConversationModal visible={showModal} onClose={() => setShowModal(false)} />
    </View>
  );
};

// ─── Chat Room ─────────────────────────────────────────────
export const ChatRoom = ({ chatId }: { chatId: string }) => {
  const dispatch = useAppDispatch();
  const flatListRef = useRef<FlatList>(null);
  const { chats, message } = useAppSelector((s) => s.chat);
  const { user } = useAppSelector((s) => s.account);
  const { pending } = useAppSelector((s) => s.asyncActions.sendMessage);
  const { pending: loadingMessages } = useAppSelector((s) => s.asyncActions.fetchMessages);
  const chat = chats[chatId];

  useEffect(() => {
    if (chatId) dispatch(fetchMessages(chatId) as any);
  }, [chatId]);

  const handleSend = () => {
    if (!chat || !message.text?.trim()) return;
    dispatch(sendMessage(chat, message.text) as any);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.member_id === user?.id;
    const senderName = chat?.participants?.find((p) => p.id === item.member_id)?.name;

    return (
      <View style={[styles.msgWrapper, isMe && styles.msgWrapperRight]}>
        {!isMe && (
          <View style={styles.msgAvatar}>
            <Text style={styles.msgAvatarText}>
              {senderName?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMine : styles.bubbleTheirs]}>
          {!isMe && chat?.room && (
            <Text style={styles.senderName}>{senderName}</Text>
          )}
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMine]}>
            {item.text}
          </Text>
          <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMine]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  if (!chat || loadingMessages) return <Loader pending fullScreen />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={chat.messages ?? []}
        keyExtractor={(item) => item.id ?? item.temp_id ?? Math.random().toString()}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="chatbubble-outline" message="No messages yet. Say hello!" />
        }
        renderItem={renderMessage}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.chatInput}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textMuted}
          value={message.text ?? ''}
          onChangeText={(v) => dispatch(updateMessageText(v))}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!message.text?.trim() || pending}
          style={[styles.sendBtn, (!message.text?.trim() || pending) && styles.sendBtnDisabled]}
        >
          {pending
            ? <ActivityIndicator size="small" color={COLORS.white} />
            : <Ionicons name="send" size={18} color={COLORS.white} />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  list: { flexGrow: 1, paddingBottom: SIZES.xl },
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  listTitle: { color: COLORS.textPrimary, fontSize: SIZES.heading, fontWeight: '800' },
  newBtn: { padding: SIZES.xs },
  chatRow: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.md,
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border + '55',
  },
  avatarWrapper: { position: 'relative' },
  avatarCircle: { backgroundColor: COLORS.primaryDark, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.white, fontWeight: '700' },
  groupBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.success,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.background,
  },
  chatInfo: { flex: 1, minWidth: 0 },
  chatMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  chatName: { color: COLORS.textPrimary, fontSize: SIZES.body, fontWeight: '500', flex: 1 },
  chatNameUnread: { fontWeight: '700' },
  chatTime: { color: COLORS.textMuted, fontSize: SIZES.caption },
  lastMessage: { color: COLORS.textSecondary, fontSize: SIZES.small },
  lastMessageUnread: { color: COLORS.textPrimary, fontWeight: '600' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },

  // Modal
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SIZES.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { color: COLORS.textPrimary, fontSize: SIZES.subtitle, fontWeight: '700' },
  createBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs, borderRadius: SIZES.radiusFull,
    minWidth: 70, alignItems: 'center',
  },
  createBtnDisabled: { backgroundColor: COLORS.border },
  createBtnText: { color: COLORS.white, fontWeight: '600', fontSize: SIZES.small },
  tabRow: { flexDirection: 'row', padding: SIZES.md, gap: SIZES.sm },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SIZES.xs, padding: SIZES.sm, borderRadius: SIZES.radiusMd,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  tabBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight + '22' },
  tabBtnText: { color: COLORS.textMuted, fontSize: SIZES.small, fontWeight: '600' },
  tabBtnTextActive: { color: COLORS.primary },
  groupNameRow: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.sm,
    marginHorizontal: SIZES.md, marginBottom: SIZES.sm,
    backgroundColor: COLORS.surfaceElevated, borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  groupNameInput: { flex: 1, color: COLORS.textPrimary, fontSize: SIZES.body },
  selectedRow: { paddingHorizontal: SIZES.md, marginBottom: SIZES.sm, maxHeight: 44 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primaryLight + '33', borderRadius: SIZES.radiusFull,
    paddingHorizontal: SIZES.sm, paddingVertical: 4, marginRight: SIZES.xs,
    borderWidth: 1, borderColor: COLORS.primary + '55',
  },
  chipText: { color: COLORS.primary, fontSize: SIZES.small, fontWeight: '600' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.sm,
    marginHorizontal: SIZES.md, marginBottom: SIZES.sm,
    backgroundColor: COLORS.surfaceElevated, borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: SIZES.body },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.md,
    padding: SIZES.sm, borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  memberRowSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight + '11' },
  memberName: { color: COLORS.textPrimary, fontSize: SIZES.body, fontWeight: '600' },
  memberEmail: { color: COLORS.textMuted, fontSize: SIZES.caption },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', padding: SIZES.xl },

  // Chat Room
  messageList: { padding: SIZES.md, gap: SIZES.sm, flexGrow: 1 },
  msgWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: SIZES.xs, marginBottom: SIZES.xs },
  msgWrapperRight: { flexDirection: 'row-reverse' },
  msgAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center', justifyContent: 'center',
  },
  msgAvatarText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  bubble: { maxWidth: '78%', padding: SIZES.sm, borderRadius: SIZES.radiusLg },
  bubbleMine: { backgroundColor: COLORS.primary, borderBottomRightRadius: SIZES.xs },
  bubbleTheirs: { backgroundColor: COLORS.surfaceElevated, borderBottomLeftRadius: SIZES.xs },
  senderName: { color: COLORS.primary, fontSize: SIZES.caption, fontWeight: '700', marginBottom: 2 },
  bubbleText: { color: COLORS.textPrimary, fontSize: SIZES.body, lineHeight: 22 },
  bubbleTextMine: { color: COLORS.white },
  bubbleTime: { color: COLORS.textMuted, fontSize: 10, marginTop: 3, textAlign: 'right' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.65)' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: SIZES.sm, borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface, gap: SIZES.sm,
  },
  chatInput: {
    flex: 1, backgroundColor: COLORS.surfaceElevated, borderRadius: SIZES.radiusLg,
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm,
    color: COLORS.textPrimary, fontSize: SIZES.body, maxHeight: 120,
    borderWidth: 1, borderColor: COLORS.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: COLORS.border },
});
