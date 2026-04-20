import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { orderBy } from 'lodash';
import { Chat, ChatMessage, ChatState, TeamMember, UpdateMessage, ChatFilters, Ordering } from '@/types';

const initialState: ChatState = {
  activeChatsFilter: undefined,
  teamMembersListOrder: 'asc',
  editedMessage: undefined,
  activeChatId: undefined,
  showChats: false,
  teamMembers: [],
  chats: {},
  message: {
    status: 'pending',
    is_deleted: false,
    created_at: '',
    member_id: '',
    files: [],
    text: '',
    id: '',
  },
  newChat: {
    is_deleted: false,
    participants: [],
    messages: [],
    id: '',
  },
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setChats: (state, action: PayloadAction<Chat[]>) => {
      const chatsMap: Record<string, Chat> = {};
      action.payload.forEach((chat) => {
        chatsMap[chat.id] = chat;
      });
      state.chats = chatsMap;
    },
    setActiveChatId: (state, action: PayloadAction<string | undefined>) => {
      state.activeChatId = action.payload;
    },
    setTeamMembers: (state, action: PayloadAction<TeamMember[]>) => {
      state.teamMembers = orderBy(action.payload, ['user_name'], [state.teamMembersListOrder as Ordering]);
    },
    updateChats: (state, action: PayloadAction<Chat>) => {
      const chat = action.payload;
      state.chats[chat.id] = chat;
    },
    pushToActiveChatMessages: (state, action: PayloadAction<ChatMessage>) => {
      const { activeChatId, chats } = state;
      if (!activeChatId || !chats[activeChatId]) return;
      chats[activeChatId].messages.push(action.payload);
    },
    updateMessageByTempId: (state, action: PayloadAction<UpdateMessage>) => {
      const { message, chatId } = action.payload;
      const chat = state.chats[chatId];
      if (!chat) return;
      chat.messages = chat.messages.map((m) =>
        m.id === message.message?.temp_id ? { ...m, ...message.message } : m
      );
    },
    updateActiveChatMessage: (state, action: PayloadAction<ChatMessage>) => {
      const { activeChatId, chats } = state;
      if (!activeChatId) return;
      const chat = chats[activeChatId];
      chat.messages = chat.messages.map((m) =>
        m.id === action.payload.id ? { ...m, ...action.payload } : m
      );
    },
    setEditedMessage: (state, action: PayloadAction<ChatMessage | undefined>) => {
      state.editedMessage = action.payload;
    },
    updateMessageText: (state, action: PayloadAction<string>) => {
      state.message.text = action.payload;
    },
    setActiveChatsFilter: (state, action: PayloadAction<ChatFilters | undefined>) => {
      state.activeChatsFilter = action.payload;
    },
    resetMessage: (state) => {
      state.message = initialState.message;
    },
    deleteChatById: (state, action: PayloadAction<string>) => {
      delete state.chats[action.payload];
    },
  },
});

export const {
  setChats,
  setActiveChatId,
  setTeamMembers,
  updateChats,
  pushToActiveChatMessages,
  updateMessageByTempId,
  updateActiveChatMessage,
  setEditedMessage,
  updateMessageText,
  setActiveChatsFilter,
  resetMessage,
  deleteChatById,
} = chatSlice.actions;

export default chatSlice.reducer;
