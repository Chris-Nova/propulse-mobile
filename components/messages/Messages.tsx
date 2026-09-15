import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Modal,
  ScrollView, ActivityIndicator, ActionSheetIOS, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchChats, fetchMessages, sendMessage, createChat, deleteMessage, editMessage,
  connectSocket, disconnectSocket,
} from '@/store/slices/chat';
import { fetchTeamMembers } from '@/store/slices/teams';
import { setActiveChatId, setMessageText, setMessageReplyTo, setEditedMessage, resetMessage } from '@/store/reducers/chat';
import { EmptyState, Loader, SectionHeader } from '@/components/shared';
import { COLORS, SIZES } from '@/constants/theme';
import { Chat, ChatMessage, TeamMember, ChatFilters } from '@/types';

// Presents Reply/Edit/Delete on a long-pressed message bubble, cross-platform.
const showMessageActions = (options: { onReply: () => void; onEdit?: () => void; onDelete?: () => void }) => {
  const labels = ['Reply'];
  if (options.onEdit) labels.push('Edit');
  if (options.onDelete) labels.push('Delete');
  labels.push('Cancel');

  const handlers = [options.onReply, options.onEdit, options.onDelete].filter(Boolean) as Array<() => void>;

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: labels,
        cancelButtonIndex: labels.length - 1,
        destructiveButtonIndex: options.onDelete ? labels.length - 2 : undefined,
      },
      (index) => {
        if (index < handlers.length) handlers[index]();
      }
    );
  } else {
    Alert.alert('Message', undefined, [
      { text: 'Reply', onPress: options.onReply },
      ...(options.onEdit ? [{ text: 'Edit', onPress: options.onEdit }] : []),
      ...(options.onDelete ? [{ text: 'Delete', onPress: options.onDelete, style: 'destructive' as const }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }
};

// Bolds "@Name" occurrences flagged in message.mentions so pings stand out in the bubble.
const MessageText = ({ item, style }: { item: ChatMessage; style: any }) => {
  if (!item.mentions?.length || !item.text) return <Text style={style}>{item.text}</Text>;

  const parts: React.ReactNode[] = [];
  let remaining = item.text;
  let key = 0;

  item.mentions.forEach((mention) => {
    const token = `@${mention.text}`;
    const idx = remaining.indexOf(token);
    if (idx === -1) return;
    if (idx > 0) parts.push(<Text key={key++}>{remaining.slice(0, idx)}</Text>);
    parts.push(<Text key={key++} style={styles.mentionText}>{token}</Text>);
    remaining = remaining.slice(idx + token.length);
  });
  parts.push(<Text key={key++}>{remaining}</Text>);

  return <Text style={style}>{parts}</Text>;
};

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
const FILTER_TABS: { label: string; value: ChatFilters | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Direct', value: ChatFilters.DIRECT_MESSAGE },
  { label: 'Rooms', value: ChatFilters.ROOM },
  { label: 'Unread', value: ChatFilters.UNREAD },
];

export const ChatList = () => {
  const dispatch = useAppDispatch();
  const { chats, activeChatsFilter } = useAppSelector((s) => s.chat);
  const { user } = useAppSelector((s) => s.account);
  const { pending } = useAppSelector((s) => s.asyncActions.fetchChats);
  const [showModal, setShowModal] = useState(false);

  const chatList = Object.values(chats).sort((a, b) => {
    const aTime = a.last_message?.created_at ?? '';
    const bTime = b.last_message?.created_at ?? '';
    return bTime.localeCompare(aTime);
  });

  useEffect(() => {
    dispatch(fetchChats(ChatFilters.ALL) as any);
    dispatch(connectSocket() as any);
    return () => { dispatch(disconnectSocket() as any); };
  }, []);

  const onSelectFilter = (filter: ChatFilters | 'all') => {
    dispatch(fetchChats(filter === 'all' ? ChatFilters.ALL : filter) as any);
  };

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
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Messages</Text>
              <TouchableOpacity onPress={() => setShowModal(true)} style={styles.newBtn}>
                <Ionicons name="create-outline" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
              {FILTER_TABS.map((tab) => {
                const isActive = (activeChatsFilter ?? 'all') === tab.value;
                return (
                  <TouchableOpacity
                    key={tab.value}
                    onPress={() => onSelectFilter(tab.value)}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
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
          const unreadCount = item.unread_count ?? 0;
          const isUnread = unreadCount > 0;

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
                    {lastMsg?.is_deleted ? 'This message was deleted' : (lastMsg?.text ?? 'No messages yet')}
                  </Text>
                </View>
                {isUnread && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
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
  const { chats, message, editedMessage } = useAppSelector((s) => s.chat);
  const { user } = useAppSelector((s) => s.account);
  const { pending } = useAppSelector((s) => s.asyncActions.sendMessage);
  const { pending: loadingMessages } = useAppSelector((s) => s.asyncActions.fetchMessages);
  const chat = chats[chatId];
  const isEditing = !!editedMessage;

  useEffect(() => {
    if (chatId) dispatch(fetchMessages(chatId) as any);
    return () => { dispatch(resetMessage()); };
  }, [chatId]);

  const handleSend = () => {
    if (!chat || !message.text?.trim()) return;

    if (isEditing && editedMessage) {
      dispatch(editMessage(editedMessage, message.text) as any);
      return;
    }

    dispatch(sendMessage(chat, message.text, message.reply_to, message.mentions ?? []) as any);
  };

  const handleReply = (item: ChatMessage) => {
    const senderName = chat?.participants?.find((p) => p.id === item.member_id)?.name ?? 'Someone';
    dispatch(setMessageReplyTo({
      message_id: item.id,
      member_id: item.member_id,
      sender_name: senderName,
      text: item.text,
    }));
  };

  const handleEdit = (item: ChatMessage) => {
    // setEditedMessage loads the full message (including text) into
    // state.message so the input below pre-fills with the original text.
    dispatch(setEditedMessage(item));
  };

  const handleDelete = (item: ChatMessage) => {
    Alert.alert('Delete message', 'This can\'t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteMessage(item) as any) },
    ]);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.member_id === user?.id;
    const senderName = chat?.participants?.find((p) => p.id === item.member_id)?.name;

    if (item.is_deleted) {
      return (
        <View style={[styles.msgWrapper, isMe && styles.msgWrapperRight]}>
          <View style={[styles.bubble, styles.bubbleDeleted]}>
            <Text style={styles.bubbleDeletedText}>This message was deleted</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.msgWrapper, isMe && styles.msgWrapperRight]}>
        {!isMe && (
          <View style={styles.msgAvatar}>
            <Text style={styles.msgAvatarText}>
              {senderName?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => showMessageActions({
            onReply: () => handleReply(item),
            onEdit: isMe ? () => handleEdit(item) : undefined,
            onDelete: isMe ? () => handleDelete(item) : undefined,
          })}
          style={[styles.bubble, isMe ? styles.bubbleMine : styles.bubbleTheirs]}
        >
          {!isMe && chat?.room && (
            <Text style={styles.senderName}>{senderName}</Text>
          )}
          {item.reply_to && (
            <View style={[styles.replyPreview, isMe && styles.replyPreviewMine]}>
              <Text style={[styles.replyPreviewName, isMe && styles.replyPreviewNameMine]} numberOfLines={1}>
                {item.reply_to.sender_name}
              </Text>
              <Text style={[styles.replyPreviewText, isMe && styles.replyPreviewTextMine]} numberOfLines={1}>
                {item.reply_to.text ?? 'Attachment'}
              </Text>
            </View>
          )}
          <MessageText item={item} style={[styles.bubbleText, isMe && styles.bubbleTextMine]} />
          <View style={styles.bubbleFooter}>
            {item.edited_at && (
              <Text style={[styles.editedLabel, isMe && styles.bubbleTimeMine]}>edited · </Text>
            )}
            <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMine]}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </TouchableOpacity>
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

      {(message.reply_to || isEditing) && (
        <View style={styles.composerContextBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.composerContextLabel}>
              {isEditing ? 'Editing message' : `Replying to ${message.reply_to?.sender_name}`}
            </Text>
            {!isEditing && (
              <Text style={styles.composerContextText} numberOfLines={1}>{message.reply_to?.text}</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => dispatch(resetMessage())} style={{ padding: SIZES.xs }}>
            <Ionicons name="close" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.chatInput}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textMuted}
          value={message.text ?? ''}
          onChangeText={(v) => dispatch(setMessageText(v))}
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
            : <Ionicons name={isEditing ? 'checkmark' : 'send'} size={18} color={COLORS.white} />}
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
  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  unreadBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  filterRow: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, flexGrow: 0 },
  filterChip: {
    paddingHorizontal: SIZES.md, paddingVertical: 6, borderRadius: SIZES.radiusFull,
    borderWidth: 1, borderColor: COLORS.border, marginRight: SIZES.xs,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { color: COLORS.textMuted, fontSize: SIZES.small, fontWeight: '600' },
  filterChipTextActive: { color: COLORS.white },

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
  bubbleFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 3 },
  bubbleTime: { color: COLORS.textMuted, fontSize: 10, textAlign: 'right' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.65)' },
  editedLabel: { color: COLORS.textMuted, fontSize: 10, fontStyle: 'italic' },
  bubbleDeleted: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.border },
  bubbleDeletedText: { color: COLORS.textMuted, fontSize: SIZES.small, fontStyle: 'italic' },
  mentionText: { fontWeight: '700', color: COLORS.warning },
  replyPreview: {
    borderLeftWidth: 3, borderLeftColor: COLORS.primary,
    backgroundColor: COLORS.background + '33', borderRadius: SIZES.radiusSm,
    paddingHorizontal: SIZES.sm, paddingVertical: 4, marginBottom: SIZES.xs,
  },
  replyPreviewMine: { borderLeftColor: COLORS.white, backgroundColor: 'rgba(255,255,255,0.15)' },
  replyPreviewName: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  replyPreviewNameMine: { color: COLORS.white },
  replyPreviewText: { color: COLORS.textMuted, fontSize: 11 },
  replyPreviewTextMine: { color: 'rgba(255,255,255,0.8)' },
  composerContextBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.xs,
    backgroundColor: COLORS.surfaceElevated,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  composerContextLabel: { color: COLORS.primary, fontSize: SIZES.caption, fontWeight: '700' },
  composerContextText: { color: COLORS.textMuted, fontSize: SIZES.small },
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
