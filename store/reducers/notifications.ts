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

interface NotificationsState {
  items: AppNotification[];
  unreadCount: number;
  // Messages that arrived live while the person was outside the Messages section. Client-only: the
  // server's notification for a message is a delayed digest, so this is what lights the bell now.
  liveMessageCount: number;
  page: number;
  hasMore: boolean;
  loading: boolean;
  loaded: boolean;
  error: string;
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  liveMessageCount: 0,
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
    },
    liveMessageArrived: (state) => {
      state.liveMessageCount += 1;
    },
    liveMessagesCleared: (state) => {
      state.liveMessageCount = 0;
    },
    resetNotifications: () => initialState,
  },
});

export const {
  listStarted, listSucceeded, listFailed, unreadCountSet,
  notificationReceived, notificationRead, allRead, resetNotifications,
  liveMessageArrived, liveMessagesCleared,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
