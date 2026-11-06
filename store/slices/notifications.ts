import { AppDispatch } from '@/store';
import { Fetch } from '@/utils/api';
import {
  AppNotification, listStarted, listSucceeded, listFailed, unreadCountSet,
  notificationRead, allRead,
} from '@/store/reducers/notifications';

export const NOTIFICATIONS_PAGE_SIZE = 20;

let lastCountFetch = 0;

// GET /notifications/unread-count -> { count }. Throttled, because every header that mounts
// asks for it; pass force to skip the throttle.
export const fetchUnreadCount = (force = false) => async (dispatch: AppDispatch) => {
  const now = Date.now();
  if (!force && now - lastCountFetch < 15000) return;
  lastCountFetch = now;
  const { success, data } = await Fetch({ path: '/notifications/unread-count' });
  if (success && typeof data?.count === 'number') dispatch(unreadCountSet(data.count));
};

// GET /notifications?page=&page_size=&include_read=true -> { notifications, has_more, ... }.
// The server only returns UNREAD ones unless include_read is set, and the design lists both.
export const fetchNotifications = (page = 1) => async (dispatch: AppDispatch) => {
  dispatch(listStarted({ append: page > 1 }));
  const { success, message, data } = await Fetch({
    path: `/notifications?page=${page}&page_size=${NOTIFICATIONS_PAGE_SIZE}&include_read=true`,
  });
  if (!success) {
    dispatch(listFailed(message || "We couldn't load your notifications."));
    return;
  }
  dispatch(
    listSucceeded({
      items: (data?.notifications ?? []) as AppNotification[],
      page: data?.page ?? page,
      hasMore: !!data?.has_more,
      append: page > 1,
    })
  );
};

// PATCH /notifications/<id>/read. Optimistic: the dot clears right away, and if the call
// fails the list and count are re-read from the server.
export const markNotificationRead = (id: string) => async (dispatch: AppDispatch) => {
  dispatch(notificationRead(id));
  const { success } = await Fetch({ path: `/notifications/${id}/read`, method: 'PATCH' });
  if (!success) {
    dispatch(fetchUnreadCount(true));
    dispatch(fetchNotifications(1));
  }
};

// POST /notifications/mark-all-read (not in the design yet, ready for when it is).
export const markAllNotificationsRead = () => async (dispatch: AppDispatch) => {
  dispatch(allRead());
  const { success } = await Fetch({ path: '/notifications/mark-all-read', method: 'POST' });
  if (!success) {
    dispatch(fetchUnreadCount(true));
    dispatch(fetchNotifications(1));
  }
};
