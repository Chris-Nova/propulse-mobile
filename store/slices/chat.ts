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
  updateMessageByTempId,
  deleteChatById,
  resetMessage,
  setTeamMembers,
} from '@/store/reducers/chat';
import { Chat, ChatMessage } from '@/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.propulse.app';
const WS_URL = (API_URL.replace('https', 'wss').replace('http', 'ws'));

let socket: WebSocket | null = null;

const finishAsyncAction = (payload: any) => (dispatch: AppDispatch) => {
  if (payload.feedbackType) {
    const type = payload.success ? 'success' : 'error';
    dispatch(showFeedback({ ...payload, type }));
  }
  dispatch(endAsyncAction(payload));
};

export const connectSocket = () => async (dispatch: AppDispatch) => {
  const token = await TokenStorage.getToken();
  if (!token) return;

  socket = new WebSocket(`${WS_URL}/ws/messages/?token=${token}`);

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const { event_type, data: payload } = data;

      switch (event_type) {
        case 'new_message':
          if (payload?.message) {
            dispatch(pushToActiveChatMessages(payload.message));
          }
          break;
        case 'message_update':
          if (payload?.message) {
            dispatch(updateMessageByTempId({
              chatId: payload.conversation_id,
              message: { message: payload.message },
            }));
          }
          break;
        case 'conversation_created':
          if (payload?.conversation) {
            dispatch(updateChats(payload.conversation));
          }
          break;
      }
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

export const fetchChats = () => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('fetchChats'));
  const { success, message, data } = await Fetch({ path: '/messages/conversations' });
  dispatch(finishAsyncAction({ target: 'fetchChats', success, message }) as any);
  if (success && data) dispatch(setChats(Array.isArray(data) ? data : (data.conversations ?? data.results ?? [])));
};

export const fetchMessages = (chatId: string) => async (dispatch: AppDispatch) => {
  dispatch(startAsyncAction('fetchMessages'));
  const { success, message, data } = await Fetch({
    path: `/messages/conversations/${chatId}/history`,
  });
  dispatch(finishAsyncAction({ target: 'fetchMessages', success, message }) as any);
  if (success && data) {
    // Update messages in the existing chat record
    const { chats } = store.getState().chat;
    const existingChat = chats[chatId];
    if (existingChat) {
      const msgs = Array.isArray(data) ? data : (data.messages ?? []);
      dispatch(updateChats({ ...existingChat, messages: msgs }));
    }
  }
};

export const sendMessage = (chat: Chat, text: string) => async (dispatch: AppDispatch) => {
  const { user } = store.getState().account;
  if (!user) return;

  const tempId = `temp_${Date.now()}`;
  const tempMessage: ChatMessage = {
    id: tempId,
    temp_id: tempId,
    text,
    status: 'pending',
    is_deleted: false,
    created_at: new Date().toISOString(),
    member_id: user.id ?? '',
    files: [],
  };

  dispatch(pushToActiveChatMessages(tempMessage));
  dispatch(startAsyncAction('sendMessage'));

  const { success, message, data } = await Fetch({
    path: `/messages/conversations/${chat.id}/message`,
    method: 'POST',
    body: { text, temp_id: tempId },
  });

  dispatch(finishAsyncAction({ target: 'sendMessage', success, message }) as any);

  if (success && data) {
    dispatch(updateMessageByTempId({ chatId: chat.id, message: { message: data } }));
  }

  dispatch(resetMessage());
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
    path: `/messages/conversations/${chatId}`,
    method: 'DELETE',
  });

  dispatch(finishAsyncAction({
    feedbackType: 'notification',
    target: 'deleteChat',
    success,
    message,
  }) as any);

  if (success) {
    dispatch(deleteChatById(chatId));
    dispatch(setActiveChatId(undefined));
  }
};

export const fetchTeamMembersForChat = () => async (dispatch: AppDispatch) => {
  const { success, data } = await Fetch({ path: '/teams/members' });
  if (success && data) dispatch(setTeamMembers(data));
};
