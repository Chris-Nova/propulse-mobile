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

let socket: WebSocket | null = null;

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

export const connectSocket = () => async (dispatch: AppDispatch) => {
  const token = await TokenStorage.getToken();
  if (!token) return;

  socket = new WebSocket(`${WS_URL}/ws/messages/?token=${token}`);

  socket.onmessage = (event) => {
    try {
      dispatch(handleSocketEvent(JSON.parse(event.data)) as any);
    } catch (_) {}
  };

  socket.onerror = () => {
    socket = null;
  };
};

export const disconnectSocket = () => () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

export const fetchChats = (filter: ChatFilters = ChatFilters.ALL, page = 1) => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('fetchChats'));

  const query = new URLSearchParams({ filter, page: String(page) }).toString();
  const { success, message, data } = await Fetch({ path: `/messages/conversations?${query}` });

  dispatch(finishAsyncAction({ target: 'fetchChats', success, message }) as any);
  if (!success || !Array.isArray(data?.conversations)) return;

  const { chats: existingChats } = store.getState().chat;
  let chats: Record<string, Chat> = {};
  for (const chat of data.conversations as Chat[]) chats[chat.id] = chat;
  if (page > 1) chats = { ...chats, ...existingChats };

  dispatch(setActiveChatsFilter(data.filter ?? filter));
  dispatch(setChatsCount(data.count ?? data.conversations.length));
  dispatch(setChats(chats));
};

export const fetchMessages = (chatId: string, cursor = '') => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('fetchMessages'));

  const { success, message, data } = await Fetch({
    path: `/messages/conversations/${chatId}/history?cursor=${encodeURIComponent(cursor)}`,
  });

  dispatch(finishAsyncAction({ target: 'fetchMessages', success, message }) as any);
  if (!success || !data) return;

  const { chats, pagination } = store.getState().chat;
  const existingChat = chats[chatId];
  if (!existingChat) return;

  const incoming = data.messages ?? [];
  const messages = cursor ? [...incoming, ...existingChat.messages] : incoming;

  dispatch(setPagination({
    ...pagination,
    messages: { has_more: !!data.has_more, cursor: data.cursor },
  }));

  dispatch(updateChats({ ...existingChat, messages }));
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
