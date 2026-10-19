import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
vi.mock('@/api/notifications.api', () => ({
  notificationsApi: {
    list: vi.fn(async () => ({
      data: [
        {
          id: 'n1',
          type: 'sheet.submitted',
          title: 't',
          body: 'b',
          link: '/approvals/s',
          readAt: null,
          createdAt: '2026-10-01T00:00:00Z',
        },
        {
          id: 'n2',
          type: 'sheet.paid',
          title: 't',
          body: 'b',
          link: '/sheets/s',
          readAt: '2026-10-01T00:00:00Z',
          createdAt: '2026-10-01T00:00:00Z',
        },
      ],
      meta: { page: 1, pageSize: 10, total: 2, unread: 1 },
    })),
    markRead: vi.fn(async () => {}),
    markAllRead: vi.fn(async () => {}),
  },
}));
import { useNotificationsStore } from './notifications.store';
describe('notifications store', () => {
  beforeEach(() => setActivePinia(createPinia()));
  it('loads, counts unread, marks read optimistically', async () => {
    const s = useNotificationsStore();
    await s.load();
    expect(s.unread).toBe(1);
    expect(s.waitingCount).toBe(1);
    await s.markRead('n1');
    expect(s.unread).toBe(0);
    expect(s.items[0].readAt).not.toBeNull();
    await s.markAllRead();
    expect(s.items.every((i) => i.readAt)).toBe(true);
  });
});
