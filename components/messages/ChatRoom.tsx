import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ActionSheetIOS, Alert, ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { store } from '@/store';
import {
  fetchChats, fetchMessages, sendMessage, deleteMessage, editMessage, deleteChat, setViewingChat,
} from '@/store/slices/chat';
import { fetchTeamMembers } from '@/store/slices/teams';
import {
  setActiveChatId, setMessageText, setMessageReplyTo, setEditedMessage, resetMessage,
} from '@/store/reducers/chat';
import { ChatFilters, ChatMessage } from '@/types';
import { BRAND_PURPLE } from '@/constants/authTheme';
import { ThemedStatusBar } from '@/components/shared/ThemedStatusBar';
import { GradientAvatar } from '@/components/shared/GradientAvatar';
import { useNotify, useSettingsTheme } from '@/components/settings/parts';
import { ConnectionError } from '@/components/messages/ChatStates';
import { setConversationPinned } from '@/components/messages/pin';

// ─── Helpers ──────────────────────────────────────────────

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const validDate = (iso?: string) => {
  const d = new Date(iso ?? '');
  return isNaN(d.getTime()) ? null : d;
};
// "Mon, 20 Oct 2026"
const dayLabel = (iso: string) => {
  const d = validDate(iso);
  return d ? `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : '';
};
const dayKey = (iso: string) => {
  const d = validDate(iso);
  return d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : 'unknown';
};
// "10:24 AM"
const clock = (iso: string) => {
  const d = validDate(iso);
  if (!d) return '';
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w: string) => w.charAt(0).toUpperCase()).join('') || '?';
const titleCase = (s = '') => s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

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
      (index: number) => {
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

// ─── Pieces ───────────────────────────────────────────────

// Bolds "@Name" occurrences flagged in message.mentions so pings stand out in the bubble.
const MessageText = ({ item, style, mentionStyle }: { item: ChatMessage; style: any; mentionStyle: any }) => {
  if (!item.mentions?.length || !item.text) return <Text style={style}>{item.text}</Text>;

  const parts: React.ReactNode[] = [];
  let remaining = item.text;
  let key = 0;

  item.mentions.forEach((mention) => {
    const token = `@${mention.text}`;
    const idx = remaining.indexOf(token);
    if (idx === -1) return;
    if (idx > 0) parts.push(<Text key={key++}>{remaining.slice(0, idx)}</Text>);
    parts.push(<Text key={key++} style={mentionStyle}>{token}</Text>);
    remaining = remaining.slice(idx + token.length);
  });
  parts.push(<Text key={key++}>{remaining}</Text>);

  return <Text style={style}>{parts}</Text>;
};

// Round avatar with a purple ring and the person's initials (next to received messages).
const RingAvatar = ({ name, size = 38 }: { name: string; size?: number }) => {
  const { theme, accent } = useSettingsTheme();
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: accent,
        backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Text style={{ color: accent, fontSize: size * 0.34, fontWeight: '700' }}>{initials(name)}</Text>
    </View>
  );
};

// pending = clock, sent = one grey tick, delivered = two grey ticks, read = two blue ticks
const READ_BLUE = '#2F9BFF';
const Ticks = ({ status }: { status: ChatMessage['status'] }) => {
  const { theme } = useSettingsTheme();
  if (status === 'pending') return <Ionicons name="time-outline" size={13} color={theme.muted} />;
  if (status === 'read') return <Ionicons name="checkmark-done" size={16} color={READ_BLUE} />;
  if (status === 'delivered') return <Ionicons name="checkmark-done" size={16} color={theme.muted} />;
  return <Ionicons name="checkmark" size={15} color={theme.muted} />;
};

type ListItem =
  | { kind: 'date'; key: string; label: string }
  | { kind: 'msg'; key: string; msg: ChatMessage; isMe: boolean; first: boolean };

// ─── Screen ───────────────────────────────────────────────

// One screen for direct messages and project rooms. Rooms differ only where they have to:
// the header shows the project and member count, and received messages carry the sender's name.
export const ChatRoom = ({ chatId }: { chatId: string }) => {
  const dispatch = useAppDispatch();
  const notify = useNotify();
  const insets = useSafeAreaInsets();
  const { theme, accent } = useSettingsTheme();
  const listRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const { chats, message, editedMessage, teamMembers } = useAppSelector((s) => s.chat);
  const { user } = useAppSelector((s) => s.account);
  const { pending: sending } = useAppSelector((s) => s.asyncActions.sendMessage);
  const chat = chats[chatId];
  const isRoom = !!chat?.room;
  const isEditing = !!editedMessage;

  const [booting, setBooting] = useState(true);
  const [failed, setFailed] = useState(false);
  // True once the server has answered with this chat's history (even an empty one). Until then we
  // show a spinner, never "No messages yet".
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const firstLoadDone = useRef(false);

  const load = useCallback(async () => {
    setFailed(false);
    setBooting(true);
    setHistoryLoaded(false);
    dispatch(setActiveChatId(chatId));
    // Opened from a notification or a cold start: the conversation list may not be loaded yet
    if (!store.getState().chat.chats[chatId]) {
      const ok = await dispatch(fetchChats(ChatFilters.ALL) as any);
      if (ok === false) {
        setFailed(true);
        setBooting(false);
        return;
      }
    }
    const ok = await dispatch(fetchMessages(chatId) as any);
    if (ok === false) setFailed(true);
    else setHistoryLoaded(true);
    setBooting(false);
    firstLoadDone.current = true;
  }, [chatId, dispatch]);

  useEffect(() => {
    firstLoadDone.current = false;
    if (chatId) load();
    return () => {
      dispatch(resetMessage());
    };
  }, [chatId]);

  // This conversation is "open" only while its screen is in front. Incoming messages are treated
  // as read only then (and a reconnect refreshes only this one); once you leave, the next message
  // counts as unread. Leaving a chat must clear the active id, or its badge never appears again.
  useFocusEffect(
    useCallback(() => {
      setViewingChat(chatId);
      dispatch(setActiveChatId(chatId));
      // Coming back to this chat: re-read its history, so anything missed while it was in the
      // background (or any state that got cleared) is restored. The first visit is load()'s job.
      if (firstLoadDone.current) dispatch(fetchMessages(chatId) as any);
      return () => {
        setViewingChat(null);
        dispatch(setActiveChatId(undefined));
      };
    }, [chatId, dispatch])
  );

  // Team members are only needed to show the other person's role in a direct message
  const isDirect = !!chat && !chat.room;
  useEffect(() => {
    if (isDirect && teamMembers.length === 0) dispatch(fetchTeamMembers() as any);
  }, [isDirect]);

  // ── Header details ──
  const other = chat?.participants?.find((p) => p.id !== user?.id) ?? chat?.participants?.[0];
  const title = chat?.room?.name ?? other?.name ?? 'Conversation';
  const avatarUri = chat?.room ? chat.room.avatar : other?.avatar;
  const roles = new Set(teamMembers.filter((m) => m.user_id === other?.id).map((m) => m.role));
  const memberCount = chat?.participants?.length ?? 0;
  // The backend has no job title for chat participants. A person's role is shown only when it is
  // the same in every project you share; otherwise their email.
  const subtitle = isRoom
    ? memberCount > 0 ? `${memberCount} ${memberCount === 1 ? 'member' : 'members'}` : 'Project room'
    : roles.size === 1 ? titleCase([...roles][0]) : (other?.email ?? '');

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(app)/messages' as any));

  const openMenu = () => {
    const pinned = !!(chat as any)?.is_pinned;
    Alert.alert(title, undefined, [
      { text: pinned ? 'Unstar' : 'Star', onPress: () => dispatch(setConversationPinned(chatId, !pinned) as any) },
      {
        text: 'Delete conversation',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Delete conversation', 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                await dispatch(deleteChat(chatId) as any);
                if (!store.getState().chat.chats[chatId]) goBack();
              },
            },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ── Messages ──
  const items = useMemo<ListItem[]>(() => {
    const out: ListItem[] = [];
    let lastDay = '';
    let lastSender = '';
    for (const msg of chat?.messages ?? []) {
      const dk = dayKey(msg.created_at);
      if (dk !== lastDay) {
        out.push({ kind: 'date', key: `d-${dk}-${out.length}`, label: dayLabel(msg.created_at) });
        lastDay = dk;
        lastSender = '';
      }
      out.push({
        kind: 'msg',
        key: msg.id ?? msg.temp_id ?? `m-${out.length}`,
        msg,
        isMe: msg.member_id === user?.id,
        first: msg.member_id !== lastSender,
      });
      lastSender = msg.member_id;
    }
    return out;
  }, [chat?.messages, user?.id]);

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

  // setEditedMessage loads the full message (including text) into state.message so the input pre-fills.
  const handleEdit = (item: ChatMessage) => dispatch(setEditedMessage(item));

  const handleDelete = (item: ChatMessage) => {
    Alert.alert('Delete message', "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dispatch(deleteMessage(item) as any) },
    ]);
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.kind === 'date') {
      return (
        <View style={styles.dateWrap}>
          <View
            style={[
              styles.datePill,
              { backgroundColor: theme.field, borderColor: theme.fieldBorder },
              theme.shadow && styles.softShadow,
            ]}
          >
            <Text style={[styles.dateText, { color: theme.muted }]}>{item.label}</Text>
          </View>
        </View>
      );
    }

    const { msg, isMe, first } = item;
    const senderName = chat?.participants?.find((p) => p.id === msg.member_id)?.name ?? 'Someone';

    const bubbleBg = isMe ? BRAND_PURPLE : theme.field;
    const textColor = isMe ? '#FFFFFF' : theme.text;

    const bubble = msg.is_deleted ? (
      <View style={[styles.bubble, styles.bubbleDeleted, { borderColor: theme.fieldBorder }]}>
        <Text style={[styles.deletedText, { color: theme.muted }]}>This message was deleted</Text>
      </View>
    ) : (
      <TouchableOpacity
        activeOpacity={0.85}
        onLongPress={() =>
          showMessageActions({
            onReply: () => handleReply(msg),
            onEdit: isMe ? () => handleEdit(msg) : undefined,
            onDelete: isMe ? () => handleDelete(msg) : undefined,
          })
        }
        style={[
          styles.bubble,
          { backgroundColor: bubbleBg },
          isMe ? styles.bubbleMine : styles.bubbleTheirs,
        ]}
      >
        {!isMe && isRoom && first && <Text style={[styles.senderName, { color: accent }]}>{senderName}</Text>}
        {msg.reply_to && (
          <View
            style={[
              styles.replyPreview,
              isMe
                ? { borderLeftColor: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.16)' }
                : { borderLeftColor: accent, backgroundColor: theme.divider },
            ]}
          >
            <Text style={[styles.replyName, { color: isMe ? '#FFFFFF' : accent }]} numberOfLines={1}>
              {msg.reply_to.sender_name}
            </Text>
            <Text style={[styles.replyText, { color: isMe ? 'rgba(255,255,255,0.85)' : theme.muted }]} numberOfLines={1}>
              {msg.reply_to.text ?? 'Attachment'}
            </Text>
          </View>
        )}
        <MessageText
          item={msg}
          style={[styles.bubbleText, { color: textColor }]}
          mentionStyle={{ fontWeight: '800' }}
        />
      </TouchableOpacity>
    );

    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMine]}>
        {!isMe && (first ? <RingAvatar name={senderName} /> : <View style={{ width: 38 }} />)}
        <View style={[styles.msgCol, isMe ? styles.msgColMine : styles.msgColTheirs]}>
          {bubble}
          <View style={styles.metaRow}>
            <Text style={[styles.meta, { color: theme.muted }]}>
              {msg.edited_at && !msg.is_deleted ? 'edited · ' : ''}{clock(msg.created_at)}
            </Text>
            {isMe && !msg.is_deleted && <Ticks status={msg.status} />}
          </View>
        </View>
      </View>
    );
  };

  // ── Body ──
  const hasMessages = (chat?.messages?.length ?? 0) > 0;
  const showError = failed && !hasMessages;
  const showSpinner = !showError && (booting || !historyLoaded) && !hasMessages;
  const canSend = !!message.text?.trim() && !sending;

  let body: React.ReactNode;
  if (showError) {
    body = <ConnectionError onRetry={load} />;
  } else if (showSpinner) {
    body = <ActivityIndicator style={{ marginTop: 80 }} color={BRAND_PURPLE} />;
  } else {
    body = (
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(it: ListItem) => it.key}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Ionicons name="chatbubble-ellipses-outline" size={44} color={theme.placeholder} />
            <Text style={[styles.emptyChatTitle, { color: theme.text }]}>No messages yet</Text>
            <Text style={[styles.emptyChatSub, { color: theme.muted }]}>
              {isRoom ? 'Start the conversation with your project team.' : 'Say hello to start the conversation.'}
            </Text>
          </View>
        }
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ThemedStatusBar style={theme.statusBar} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: theme.divider }]}>
        <TouchableOpacity
          onPress={goBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <GradientAvatar uri={avatarUri} initial={initials(title)} size={50} fontSize={16} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerName, { color: theme.text }]} numberOfLines={1}>{title}</Text>
          {!!subtitle && <Text style={[styles.headerSub, { color: theme.muted }]} numberOfLines={1}>{subtitle}</Text>}
        </View>
        {!!chat && (
          <TouchableOpacity
            onPress={openMenu}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Conversation options"
          >
            <Ionicons name="ellipsis-vertical" size={20} color={theme.text} />
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flex: 1 }}>{body}</View>

      {/* Composer (hidden while the connection-error screen is up) */}
      {!showError && !!chat && (
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) + 4 }]}>
          {(message.reply_to || isEditing) && (
            <View style={[styles.contextBar, { backgroundColor: theme.field, borderLeftColor: accent }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.contextLabel, { color: accent }]}>
                  {isEditing ? 'Editing message' : `Replying to ${message.reply_to?.sender_name}`}
                </Text>
                {!isEditing && (
                  <Text style={[styles.contextText, { color: theme.muted }]} numberOfLines={1}>
                    {message.reply_to?.text}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => dispatch(resetMessage())}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Cancel"
              >
                <Ionicons name="close" size={18} color={theme.muted} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.composerRow}>
            <TouchableOpacity
              onPress={() => notify('Sending attachments is coming soon.')}
              activeOpacity={0.85}
              style={styles.roundBtn}
              accessibilityLabel="Add attachment"
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={[styles.field, { backgroundColor: theme.field, borderColor: theme.fieldBorder }]}>
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: theme.text }]}
                placeholder="Type a message...."
                placeholderTextColor={theme.placeholder}
                value={message.text ?? ''}
                onChangeText={(v: string) => dispatch(setMessageText(v))}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                onPress={() => inputRef.current?.focus()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Emoji"
              >
                <Ionicons name="happy-outline" size={22} color={theme.muted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleSend}
              disabled={!canSend}
              activeOpacity={0.85}
              style={[styles.roundBtn, !canSend && { opacity: 0.5 }]}
              accessibilityLabel={isEditing ? 'Save edit' : 'Send message'}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name={isEditing ? 'checkmark' : 'paper-plane-outline'} size={19} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerName: { fontSize: 14, fontWeight: '700' },
  headerSub: { fontSize: 10.5, marginTop: 3 },

  list: { flexGrow: 1, paddingHorizontal: 14, paddingTop: 18, paddingBottom: 14 },
  dateWrap: { alignItems: 'center', marginBottom: 18 },
  datePill: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 8 },
  softShadow: {
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  dateText: { fontSize: 12, fontWeight: '500' },

  msgRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  msgRowMine: { justifyContent: 'flex-end' },
  msgCol: { maxWidth: '78%' },
  msgColTheirs: { alignItems: 'flex-start' },
  msgColMine: { alignItems: 'flex-end' },
  bubble: { borderRadius: 12, paddingHorizontal: 18, paddingVertical: 14 },
  bubbleTheirs: { borderBottomLeftRadius: 4 },
  bubbleMine: { borderBottomRightRadius: 4 },
  bubbleDeleted: { backgroundColor: 'transparent', borderWidth: 1 },
  deletedText: { fontSize: 12.5, fontStyle: 'italic' },
  bubbleText: { fontSize: 13.5, lineHeight: 20 },
  senderName: { fontSize: 11.5, fontWeight: '700', marginBottom: 4 },
  replyPreview: { borderLeftWidth: 3, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 8 },
  replyName: { fontSize: 11, fontWeight: '700' },
  replyText: { fontSize: 11 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  meta: { fontSize: 10 },

  emptyChat: { alignItems: 'center', paddingTop: 90, paddingHorizontal: 32 },
  emptyChatTitle: { fontSize: 15, fontWeight: '700', marginTop: 14 },
  emptyChatSub: { fontSize: 12, textAlign: 'center', marginTop: 6 },

  composer: { paddingHorizontal: 14, paddingTop: 8 },
  contextBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10, borderLeftWidth: 3, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8,
  },
  contextLabel: { fontSize: 11.5, fontWeight: '700' },
  contextText: { fontSize: 11.5, marginTop: 1 },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  roundBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: BRAND_PURPLE,
    alignItems: 'center', justifyContent: 'center',
  },
  field: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 42,
    borderRadius: 21, borderWidth: 1, paddingLeft: 18, paddingRight: 14,
  },
  input: { flex: 1, fontSize: 13, maxHeight: 110, paddingVertical: Platform.OS === 'ios' ? 10 : 6 },
});
