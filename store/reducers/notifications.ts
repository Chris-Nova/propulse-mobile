import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Shape of one item from GET /notifications (propulse-api, NotificationSerializer).
export interface AppNotification {
  id: string;
  actor_id: string | null;
  category: 'messages' | 'projects' | 'invitations' | 'billing' | 'system' | string;
  event_type: string;
  title: string;
  body: string;
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

// A message that arrived live while the person was outside Messages, grouped per conversation.
// Client-only: the server's own message notification is a digest created after a delay.
export interface LiveMessageAlert {
  conversation_id: string;
  sender_name: string;
  room_name?: string;
  text: string;
  count: number;
  created_at: string;
}

// Shaped like a server notification so the list can render it with the same row.
export const liveAlertToNotification = (a: LiveMessageAlert): AppNotification => ({
  id: `live-${a.conversation_id}`,
  actor_id: null,
  category: 'messages',
  event_type: 'message.live',
  title: a.room_name
    ? (a.count > 1 ? `${a.count} new messages in ${a.room_name}` : `New message in ${a.room_name}`)
    : (a.count > 1 ? `${a.count} new messages from ${a.sender_name}` : `New message from ${a.sender_name}`),
  body: a.room_name ? `${a.sender_name}: ${a.text}` : a.text,
  metadata: { conversation_id: a.conversation_id },
  is_read: false,
  created_at: a.created_at,
});

interface NotificationsState {
  items: AppNotification[];
  unreadCount: number;
  // Messages that arrived live while the person was outside the Messages section. This is what
  // lights the bell now and what the list shows until the server's delayed digest takes over.
  liveMessages: LiveMessageAlert[];
  page: number;
  hasMore: boolean;
  loading: boolean;
  loaded: boolean;
  error: string;
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  liveMessages: [],
  page: 0,
  hasMore: false,
  loading: false,
  loaded: false,
  error: '',
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    listStarted: (state, action: PayloadAction<{ append: boolean }>) => {
      state.loading = true;
      if (!action.payload.append) state.error = '';
    },
    listSucceeded: (
      state,
      action: PayloadAction<{ items: AppNotification[]; page: number; hasMore: boolean; append: boolean }>
    ) => {
      const { items, page, hasMore, append } = action.payload;
      if (append) {
        const seen = new Set(state.items.map((i) => i.id));
        state.items.push(...items.filter((i) => !seen.has(i.id)));
      } else {
        state.items = items;
      }
      state.page = page;
      state.hasMore = hasMore;
      state.loading = false;
      state.loaded = true;
      state.error = '';
    },
    listFailed: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    unreadCountSet: (state, action: PayloadAction<number>) => {
      state.unreadCount = Math.max(0, action.payload);
    },
    // Live push (WebSocket "notification.created"). The server re-sends an existing row when a
    // message digest is refreshed, so match by id: replace it, move it to the top.
    notificationReceived: (state, action: PayloadAction<AppNotification>) => {
      const incoming = action.payload;
      if (!incoming?.id) return;
      const existing = state.items.find((i) => i.id === incoming.id);
      state.items = [incoming, ...state.items.filter((i) => i.id !== incoming.id)];
      const wasUnread = existing ? !existing.is_read : false;
      if (!incoming.is_read && !wasUnread) state.unreadCount += 1;
      if (incoming.is_read && wasUnread) state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    notificationRead: (state, action: PayloadAction<string>) => {
      const n = state.items.find((i) => i.id === action.payload);
      if (n && !n.is_read) {
        n.is_read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    allRead: (state) => {
      state.items.forEach((n) => {
        n.is_read = true;
      });
      state.unreadCount = 0;
      state.liveMessages = [];
    },
    liveMessageArrived: (state, action: PayloadAction<Omit<LiveMessageAlert, 'count'>>) => {
      const incoming = action.payload;
      const existing = state.liveMessages.find((a) => a.conversation_id === incoming.conversation_id);
      const next: LiveMessageAlert = { ...incoming, count: (existing?.count ?? 0) + 1 };
      state.liveMessages = [next, ...state.liveMessages.filter((a) => a.conversation_id !== incoming.conversation_id)];
    },
    liveMessagesClearedFor: (state, action: PayloadAction<string[]>) => {
      state.liveMessages = state.liveMessages.filter((a) => !action.payload.includes(a.conversation_id));
    },
    liveMessagesCleared: (state) => {
      state.liveMessages = [];
    },
    resetNotifications: () => initialState,
  },
});

export const {
  listStarted, listSucceeded, listFailed, unreadCountSet,
  notificationReceived, notificationRead, allRead, resetNotifications,
  liveMessageArrived, liveMessagesCleared, liveMessagesClearedFor,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
