import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { orderBy } from 'lodash';
import {
  Chat, File, ChatMessage, ChatState, ChatTypes, Ordering, TeamMember,
  UpdateMessage, MentionPopover, Mention, MarkMessagesAsRead, ChatFilters,
  Document,
} from '@/types';

const mention: MentionPopover = {
  anchorRect: undefined,
  userId: '',
};

const initialState: ChatState = {
  activeChatsFilter: ChatFilters.ALL,
  teamMembersListOrder: 'asc',
  editedMessage: undefined,
  activeChatId: undefined,
  suggestedMembers: [],
  isRecording: false,
  showChats: false,
  teamMembers: [],
  media: [],
  chats: {},
  count: 0,
  mention,
  pagination: {
    messages: { cursor: undefined, has_more: false },
    chat: { cursor: undefined, has_more: false },
  },
  message: {
    voice_note: undefined,
    reply_to: undefined,
    status: 'pending',
    is_deleted: false,
    created_at: '',
    member_id: '',
    mentions: [],
    files: [],
    text: '',
    id: '',
  },
  model: {
    is_deleted: false,
    participants: [],
    messages: [],
    id: '',
  },
};

// Mirrors `filterObject` from the web app's utils: strips the given keys
// from an object (used to drop temp_id once a message is confirmed by the server).
const omitKeys = <T extends Record<string, any>>(target: T, keys: string[]): T => {
  const clone = { ...target };
  keys.forEach((key) => delete clone[key]);
  return clone;
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSuggestedTeamMembers: (state, action: PayloadAction<ChatState['suggestedMembers']>) => {
      state.suggestedMembers = action.payload;
    },
    setActiveChatsFilter: (state, action: PayloadAction<ChatFilters>) => {
      state.activeChatsFilter = action.payload;
    },
    setMessageVoiceNote: (state, action: PayloadAction<ChatMessage['voice_note']>) => {
      state.message.voice_note = action.payload;
    },
    setMessageReplyTo: (state, action: PayloadAction<ChatMessage['reply_to']>) => {
      state.message.reply_to = action.payload;
    },
    setActiveChatId: (state, action: PayloadAction<string | undefined>) => {
      state.activeChatId = action.payload;
    },
    setTeamMembers: (state, action: PayloadAction<TeamMember[]>) => {
      state.teamMembers = orderBy(action.payload, ['user_name'], [state.teamMembersListOrder as Ordering]);
    },
    // Bumps unread_count — used when a message arrives for a chat that
    // isn't currently open on screen.
    pushReceivedMessageToChat: (state, action: PayloadAction<UpdateMessage>) => {
      const { message, chatId } = action.payload;
      if (!message || !chatId) return;
      const chat = state.chats[chatId];
      if (!chat) return;
      chat.unread_count = (chat.unread_count || 0) + 1;
      chat.messages.push(message as ChatMessage);
    },
    setPagination: (state, action: PayloadAction<ChatState['pagination']>) => {
      state.pagination = action.payload;
    },
    markMessagesAsRead: (state, action: PayloadAction<MarkMessagesAsRead>) => {
      const { messageIds, chatId } = action.payload;
      const chat = state.chats[chatId];
      if (!chat) return;
      chat.messages = chat.messages.map((chatMessage) =>
        messageIds.includes(chatMessage.id) ? { ...chatMessage, status: 'read' } : chatMessage
      );
    },
    pushToActiveChatMessages: (state, action: PayloadAction<ChatMessage>) => {
      const { activeChatId, chats } = state;
      if (!activeChatId || !chats[activeChatId]) return;
      chats[activeChatId].messages.push(action.payload);
    },
    updateMessageByTempId: (state, action: PayloadAction<UpdateMessage>) => {
      const { defaultToId = false, message, chatId } = action.payload;
      const chat = state.chats[chatId];
      if (!chat) return;

      const newMessage = omitKeys(message, ['temp_id']) as ChatMessage;

      chat.messages = chat.messages.map((chatMessage) => {
        const isTempMessage = chatMessage.id === message.temp_id;
        const isSentMessage = chatMessage.id === message.id;
        if (isTempMessage || (defaultToId && isSentMessage)) return newMessage;
        return chatMessage;
      });
    },
    updateActiveChatMessage: (state, action: PayloadAction<ChatMessage>) => {
      const { activeChatId, chats } = state;
      if (!activeChatId) return;
      const activeChat = chats[activeChatId];
      if (!activeChat) return;
      const message = action.payload;
      activeChat.messages = activeChat.messages.map((chatMessage) =>
        chatMessage.id === message.id ? { ...chatMessage, ...message } : chatMessage
      );
    },
    setMessageFiles: (state, action: PayloadAction<Array<File>>) => {
      state.message.files = action.payload;
    },
    removeRoomParticipant: (state, action: PayloadAction<TeamMember>) => {
      state.model.participants = state.model.participants.filter(
        ({ id }) => id !== action.payload.user_id
      );
    },
    updateMessageById: (state, action: PayloadAction<UpdateMessage>) => {
      const { message, chatId } = action.payload;
      const chat = state.chats[chatId];
      if (!chat) return;
      chat.messages = chat.messages.map((chatMessage) =>
        chatMessage.id === message.id ? { ...chatMessage, ...message } : chatMessage
      );
    },
    deleteMessageById: (state, action: PayloadAction<UpdateMessage>) => {
      const { message, chatId } = action.payload;
      const chat = state.chats[chatId];
      if (!chat) return;
      chat.messages = chat.messages.filter(({ id }) => id !== message.id);
    },
    updateActiveChat: (state, action: PayloadAction<Partial<Chat>>) => {
      if (!state.activeChatId) return;
      const activeChat = state.chats[state.activeChatId];
      state.chats[state.activeChatId] = { ...activeChat, ...action.payload };
    },
    addRoomParticipant: (state, action: PayloadAction<TeamMember>) => {
      const { user_email, user_name, user_id } = action.payload;
      state.model.participants.push({ email: user_email, name: user_name, id: user_id });
    },
    updateMessageMentions: (state, action: PayloadAction<Mention>) => {
      state.message.mentions = [...state.message.mentions, action.payload];
    },
    updateChatModel: (state, action: PayloadAction<Partial<Chat>>) => {
      state.model = { ...state.model, ...action.payload };
    },
    setMembersListOrder: (state, action: PayloadAction<Ordering>) => {
      state.teamMembers = orderBy(state.teamMembers, ['user_name'], [action.payload]);
      state.teamMembersListOrder = action.payload;
    },
    setChatMedia: (state, action: PayloadAction<Array<Document>>) => {
      state.media = action.payload;
    },
    setEditedMessage: (state, action: PayloadAction<ChatMessage | undefined>) => {
      state.editedMessage = action.payload;
      if (action.payload) state.message = action.payload;
    },
    setChats: (state, action: PayloadAction<Record<string, Chat>>) => {
      state.chats = action.payload;
    },
    setMention: (state, action: PayloadAction<MentionPopover>) => {
      state.mention = action.payload;
    },
    setNewChatType: (state, action: PayloadAction<ChatTypes>) => {
      if (action.payload === 'room') {
        state.model.room = state.model.room || { avatar: '', name: '' };
      } else {
        state.model.room = undefined;
      }
    },
    updateChatByTempId: (state, action: PayloadAction<Chat>) => {
      const { temp_id, id } = action.payload;
      if (!temp_id) return;

      const savedChat = omitKeys(action.payload, ['temp_id']) as Chat;
      delete state.chats[temp_id];
      state.activeChatId = id;

      // Position updated chat first in the list.
      state.chats = { [id]: savedChat, ...state.chats };
    },
    setIsRecording: (state, action: PayloadAction<boolean>) => {
      state.isRecording = action.payload;
    },
    deleteChatById: (state, action: PayloadAction<string>) => {
      delete state.chats[action.payload];
    },
    setMessageText: (state, action: PayloadAction<string>) => {
      state.message.text = action.payload;
    },
    deleteEmptyActiveChat: (state) => {
      const { activeChatId, chats } = state;
      // Remove a just-created chat if it never got any messages,
      // before switching the active chat elsewhere.
      if (activeChatId) {
        const { messages = [], temp_id, room } = chats?.[activeChatId] || {};
        if (!messages.length && temp_id && !room) delete chats?.[activeChatId];
      }
    },
    setChatsCount: (state, action: PayloadAction<number>) => {
      state.count = action.payload;
    },
    setChatModel: (state, action: PayloadAction<Chat>) => {
      state.model = action.payload;
    },
    updateChats: (state, action: PayloadAction<Chat>) => {
      state.chats[action.payload.id] = action.payload;
    },
    resetChatModel: (state) => {
      state.model = initialState.model;
    },
    resetMessage: (state) => {
      state.message = initialState.message;
      state.editedMessage = undefined;
      state.isRecording = false;
    },
    resetMention: (state) => {
      state.mention = mention;
    },
  },
});

export const {
  pushReceivedMessageToChat,
  pushToActiveChatMessages,
  setSuggestedTeamMembers,
  updateActiveChatMessage,
  updateMessageByTempId,
  updateMessageMentions,
  deleteEmptyActiveChat,
  removeRoomParticipant,
  setActiveChatsFilter,
  setMembersListOrder,
  setMessageVoiceNote,
  updateChatByTempId,
  addRoomParticipant,
  markMessagesAsRead,
  updateMessageById,
  deleteMessageById,
  setMessageReplyTo,
  setEditedMessage,
  updateActiveChat,
  setActiveChatId,
  setMessageFiles,
  updateChatModel,
  setIsRecording,
  setNewChatType,
  setTeamMembers,
  setMessageText,
  deleteChatById,
  resetChatModel,
  setPagination,
  setChatsCount,
  setChatMedia,
  setChatModel,
  resetMessage,
  resetMention,
  updateChats,
  setMention,
  setChats,
} = chatSlice.actions;

export default chatSlice.reducer;
