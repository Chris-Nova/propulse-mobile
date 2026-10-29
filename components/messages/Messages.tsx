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
  fetchChats, fetchMessages, sendMessage, createChat, deleteMessage, editMessage, deleteChat,
  connectSocket, disconnectSocket,
} from '@/store/slices/chat';
import { fetchTeamMembers } from '@/store/slices/teams';
import { setActiveChatId, setMessageText, setMessageReplyTo, setEditedMessage, resetMessage } from '@/store/reducers/chat';
import { EmptyState, Loader, SectionHeader } from '@/components/shared';
import { COLORS, SIZES } from '@/constants/theme';
import { Chat, ChatMessage, TeamMember, ChatFilters } from '@/types';
import { StatusBar } from 'expo-status-bar';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { useDashboardTheme } from '@/constants/dashboardTheme';
import { formatStamp, initialOf } from '@/utils/format';
import { AppHeader } from '@/components/shared/AppHeader';
import { SearchField, FilterPills, PageTitle } from '@/components/shared/ListControls';
import { BottomGlow } from '@/components/splash/BottomGlow';
import { setConversationPinned } from './pin';

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
  const theme = useDashboardTheme();
  const { chats, activeChatsFilter } = useAppSelector((s) => s.chat);
  const { user } = useAppSelector((s) => s.account);
  const { pending } = useAppSelector((s) => s.asyncActions.fetchChats);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchChats(ChatFilters.ALL) as any);
    dispatch(connectSocket() as any);
    return () => { dispatch(disconnectSocket() as any); };
  }, []);

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

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBar} />
      {theme.glow && <BottomGlow color={BRAND_PURPLE} opacity={0.22} />}
      <FlatList
        data={chatList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.screenList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
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
        }
        ListEmptyComponent={
          pending ? (
            <Text style={[styles.empty, { color: theme.muted }]}>Loading conversations…</Text>
          ) : (
            <Text style={[styles.empty, { color: theme.muted }]}>
              {search ? 'No conversations match your search.' : 'No conversations yet. Tap the compose icon to start one.'}
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
