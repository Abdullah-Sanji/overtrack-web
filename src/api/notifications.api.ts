import { get, post } from './client';
import type { Notification } from './types';

export interface NotificationPage {
  data: Notification[];
  meta: { page: number; pageSize: number; total: number; unread: number };
}

export const notificationsApi = {
  list: (unreadOnly = false, page = 1, pageSize = 10) =>
    get<NotificationPage>('/me/notifications', {
      unreadOnly: unreadOnly ? 'true' : undefined,
      page,
      pageSize,
    }),
  markRead: (id: string) => post<void>(`/me/notifications/${id}/read`),
  markAllRead: () => post<void>('/me/notifications/read-all'),
};
