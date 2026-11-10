import { notificationReceived } from '@/store/reducers/notifications';
import { playNotificationSound } from '@/utils/notificationSound';
import { fetchUnreadCount } from '@/store/slices/notifications';
import { AppDispatch, store } from '@/store';
import { Fetch } from '@/utils/api';
import { TokenStorage } from '@/utils/storage';
import { startAsyncAction, endAsyncAction } from '@/store/reducers/asyncActions';
import { showFeedback } from '@/store/reducers/feedback';
import {
  setChats,
  updateChats,
  setActiveChatId,
  pushToActiveChatMessages,
  pushReceivedMessageToChat,
  updateMessageByTempId,
  updateMessageById,
  deleteMessageById,
  markMessagesAsRead,
  deleteChatById,
  resetMessage,
  setTeamMembers,
  setSuggestedTeamMembers,
  setPagination,
  setChatsCount,
  setActiveChatsFilter,
} from '@/store/reducers/chat';
import { Chat, ChatMessage, ChatFilters, Mention } from '@/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.propulse.app';
const WS_URL = API_URL.replace('https', 'wss').replace('http', 'ws');

// ─── Socket lifecycle ─────────────────────────────────────
// One socket per user, kept open while the app is in use (see useChatSocket). It reconnects with a
// growing delay when it drops, and gives up only when the server rejects the token.
let socket: WebSocket | null = null;
let wanted = false; // should the socket be open right now?
let opening = false; // guards against two connect calls racing
let attempt = 0;
let hasConnected = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let viewingChatId: string | null = null;

const AUTH_CLOSE_CODES = [4001, 4003]; // backend: missing/invalid token, token does not match the user

// The chat screen reports which conversation is on screen. Only that one is re-read after a
// reconnect, because loading history marks a conversation as read on the server.
export const setViewingChat = (chatId: string | null) => {
  viewingChatId = chatId;
};

const clearRetry = () => {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
};

const finishAsyncAction = (payload: any) => (dispatch: AppDispatch) => {
  if (payload.feedbackType) {
    const type = payload.success ? 'success' : 'error';
    dispatch(showFeedback({ ...payload, type }));
  }
  dispatch(endAsyncAction(payload));
};

const randomId = () => `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// Mirrors the web app's `chatWebSocketEventHandler` — event names and
// payload shape are set by the backend, so this must stay in lockstep
// with components/chats/slices/index.ts on the web app.
const handleSocketEvent = (event: any) => async (dispatch: AppDispatch) => {
  const { chats } = store.getState().chat;

  // In-app notification pushed by the server ({ event_type: 'notification.created', data: { notification } })
  if (event?.event_type === 'notification.created') {
    const incoming = event.data?.notification;
    if (incoming) {
      // The server re-sends a message digest when it grows; only a first-time unread one is "new"
      const alreadyUnread = store.getState().notifications.items.some((i) => i.id === incoming.id && !i.is_read);
      dispatch(notificationReceived(incoming));
      if (!incoming.is_read && !alreadyUnread) playNotificationSound(incoming, viewingChatId);
    }
    return;
  }

  const {
    event_type,
    data: {
      conversation_id: chatId,
      conversation: chat,
      message_ids,
      message_id,
      message,
    } = {},
  } = event;

  if (['conversation_received', 'conversation_created'].includes(event_type) && chat) {
    dispatch(updateChats(chat));
  }

  if (event_type === 'conversation_deleted' && chatId) {
    dispatch(deleteChatById(chatId));
  }

  if (!chatId) return;
  const targetChat = chats[chatId];
  if (!targetChat && event_type.startsWith('message_')) return; // chat not loaded locally, ignore

  if (event_type === 'message_read' && message_ids) {
    dispatch(markMessagesAsRead({ messageIds: message_ids, chatId }));
  }

  if (event_type === 'message_deleted' && message_id) {
    dispatch(updateMessageById({ chatId, message: { id: message_id, is_deleted: true } }));
  }

  if (message) {
    if (event_type === 'message_delivered') {
      dispatch(updateMessageByTempId({ defaultToId: true, message, chatId }));
    }

    if (event_type === 'message_received') {
      const { activeChatId } = store.getState().chat;
      if (activeChatId === chatId) {
        dispatch(pushToActiveChatMessages(message));
      } else {
        dispatch(pushReceivedMessageToChat({ message, chatId }));
      }
    }

    if (event_type === 'message_edited') {
      dispatch(updateMessageById({ message, chatId }));
    }
  }
};

const openSocket = async (dispatch: AppDispatch) => {
  if (!wanted || opening) return;
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;

  opening = true;
  try {
    const token = await TokenStorage.getToken();
    const { user } = store.getState().account;
    if (!wanted || !token || !user?.id) return;

    // Backend route is `ws/<user_uuid>/?token=...` (apps/messages/routing.py) —
    // it's a single unified socket per user, not per-conversation.
    const ws = new WebSocket(`${WS_URL}/ws/${user.id}/?token=${token}`);
    socket = ws;

    ws.onopen = () => {
      attempt = 0;
      if (hasConnected) {
        // We were away (offline or in the background): catch up on whatever was missed
        const { activeChatsFilter } = store.getState().chat;
        dispatch(fetchChats((activeChatsFilter ?? ChatFilters.ALL) as ChatFilters) as any);
        dispatch(fetchUnreadCount(true) as any);
        if (viewingChatId) dispatch(fetchMessages(viewingChatId) as any);
      }
      hasConnected = true;
    };

    ws.onmessage = (event) => {
      try {
        dispatch(handleSocketEvent(JSON.parse(event.data)) as any);
      } catch (_) {}
    };

    ws.onerror = () => {}; // onclose always follows

    ws.onclose = (event) => {
      if (socket === ws) socket = null;
      if (!wanted || AUTH_CLOSE_CODES.includes(event.code)) return;
      clearRetry();
      const delay = Math.min(30000, 1000 * 2 ** attempt);
      attempt += 1;
      retryTimer = setTimeout(() => openSocket(dispatch), delay);
    };
  } finally {
    opening = false;
  }
};

export const connectSocket = () => async (dispatch: AppDispatch) => {
  wanted = true;
  clearRetry();
  await openSocket(dispatch);
};

export const disconnectSocket = () => () => {
  wanted = false;
  clearRetry();
  attempt = 0;
  if (socket) {
    socket.close();
    socket = null;
  }
};

export const fetchChats = (filter: ChatFilters = ChatFilters.ALL) => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('fetchChats'));

  // The backend's list_conversations endpoint returns the full set for the
  // given filter in one response — there's no `page`/`cursor` param here.
  const query = new URLSearchParams({ filter }).toString();
  const { success, message, data } = await Fetch({ path: `/messages/conversations?${query}` });

  dispatch(finishAsyncAction({ target: 'fetchChats', success, message }) as any);
  if (!success || !Array.isArray(data?.conversations)) return false;

  const chats: Record<string, Chat> = {};
  for (const chat of data.conversations as Chat[]) chats[chat.id] = chat;

  dispatch(setActiveChatsFilter(data.filter ?? filter));
  dispatch(setChatsCount(data.count ?? data.conversations.length));
  dispatch(setChats(chats));
  return true;
};

export const fetchMessages = (chatId: string, cursor = '') => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('fetchMessages'));

  const { success, message, data } = await Fetch({
    path: `/messages/conversations/${chatId}/history?cursor=${encodeURIComponent(cursor)}`,
  });

  dispatch(finishAsyncAction({ target: 'fetchMessages', success, message }) as any);
  if (!success || !data) return false;

  const { chats, pagination } = store.getState().chat;
  const existingChat = chats[chatId];
  if (!existingChat) return false;

  const incoming = data.messages ?? [];
  const messages = cursor ? [...incoming, ...existingChat.messages] : incoming;

  dispatch(setPagination({
    ...pagination,
    messages: { has_more: !!data.has_more, cursor: data.cursor },
  }));

  // The backend marks the whole conversation read as a side effect of this
  // call (see MessageService.get_conversation_messages), so reflect that
  // locally right away instead of waiting on a follow-up fetchChats.
  dispatch(updateChats({ ...existingChat, messages, unread_count: cursor ? existingChat.unread_count : 0 }));
  return true;
};

export const markConversationAsRead = (chatId: string) => async (dispatch: AppDispatch) => {
  const { success } = await Fetch({ path: `/messages/conversations/${chatId}/read`, method: 'POST' });
  if (success) {
    const { chats } = store.getState().chat;
    const chat = chats[chatId];
    if (chat) dispatch(updateChats({ ...chat, unread_count: 0 }));
  }
};

export const sendMessage = (chat: Chat, text: string, replyTo?: ChatMessage['reply_to'], mentions: Mention[] = []) =>
  async (dispatch: AppDispatch) => {
    const { user } = store.getState().account;
    if (!user) return;

    const tempId = randomId();
    const tempMessage: ChatMessage = {
      id: tempId,
      temp_id: tempId,
      text,
      status: 'pending',
      is_deleted: false,
      created_at: new Date().toISOString(),
      member_id: user.id ?? '',
      files: [],
      mentions,
      reply_to: replyTo,
    };

    dispatch(pushToActiveChatMessages(tempMessage));
    dispatch(resetMessage());
    dispatch(startAsyncAction('sendMessage'));

    const { success, message, data } = await Fetch({
      path: `/messages/conversations/${chat.id}/message`,
      method: 'POST',
      body: { text, temp_id: tempId, mentions, reply_to: replyTo?.message_id },
    });

    dispatch(finishAsyncAction({ target: 'sendMessage', success, message }) as any);

    if (success && data) {
      dispatch(updateMessageByTempId({ chatId: chat.id, message: data }));
    }
  };

export const editMessage = (chatMessage: ChatMessage, text: string) => async (dispatch: AppDispatch) => {
  const { activeChatId } = store.getState().chat;
  if (!activeChatId) return;

  dispatch(startAsyncAction('updateMessage'));

  const { success, message, data } = await Fetch({
    path: `/messages/conversations/${activeChatId}/message/${chatMessage.id}`,
    method: 'PATCH',
    body: { ...chatMessage, text, reply_to: chatMessage.reply_to?.message_id },
  });

  dispatch(finishAsyncAction({ target: 'updateMessage', success, message }) as any);
  if (!success) return;

  dispatch(updateMessageById({ chatId: activeChatId, message: { ...data } }));
  dispatch(resetMessage());
};

export const deleteMessage = (chatMessage: ChatMessage) => async (dispatch: AppDispatch) => {
  const { activeChatId } = store.getState().chat;
  if (!activeChatId) return false;

  dispatch(startAsyncAction('deleteMessage'));

  const { success, message } = await Fetch({
    path: `/messages/conversations/${activeChatId}/message/${chatMessage.id}/delete`,
    method: 'DELETE',
  });

  dispatch(finishAsyncAction({ target: 'deleteMessage', success, message }) as any);
  if (success) {
    dispatch(deleteMessageById({ chatId: activeChatId, message: { id: chatMessage.id } }));
  }
  return success;
};

export const createChat = (body: Record<string, any>) => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('createChat'));

  const { success, message, data } = await Fetch({
    path: '/messages/conversations',
    method: 'POST',
    body,
  });

  dispatch(finishAsyncAction({ target: 'createChat', success, message }) as any);

  if (success && data) {
    dispatch(updateChats(data));
    dispatch(setActiveChatId(data.id));
  }

  return data?.id;
};

export const deleteChat = (chatId: string) => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('deleteChat'));

  const { success, message } = await Fetch({
    path: `/messages/conversations/${chatId}/delete`,
    method: 'DELETE',
  });

  dispatch(finishAsyncAction({ feedbackType: 'notification', target: 'deleteChat', success, message }) as any);

  if (success) {
    dispatch(deleteChatById(chatId));
    dispatch(setActiveChatId(undefined));
  }
};

export const fetchTeamMembersForChat = () => async (dispatch: AppDispatch) => {
  const { success, data } = await Fetch({ path: '/teams/members' });
  if (success && data) dispatch(setTeamMembers(data.members ?? data));
};

export const suggestTeamMembers = (query: string) => async (dispatch: AppDispatch) => {
  const { activeChatId } = store.getState().chat;
  if (!activeChatId) return;

  const { success, data } = await Fetch({
    path: `/messages/conversations/${activeChatId}/members/suggest?q=${encodeURIComponent(query)}`,
  });

  if (success) dispatch(setSuggestedTeamMembers(data?.members ?? []));
};
