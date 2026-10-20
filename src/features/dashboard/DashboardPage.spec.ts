import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import DashboardPage from './DashboardPage.vue';
import { makeUser } from '@/test/fixtures';

vi.mock('vue-router', () => ({
  RouterLink: { template: '<a><slot/></a>' },
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('@/api/sheets.api', () => ({
  sheetsApi: {
    forPeriod: vi.fn(async () => ({
      id: 's',
      period: '2026-10',
      status: 'draft',
      totalHours: 3.5,
      totalWeightedHours: 5.25,
      version: 1,
    })),
    list: vi.fn(async () => ({ data: [], meta: { page: 1, pageSize: 1, total: 2 } })),
  },
}));
vi.mock('@/api/inbox.api', () => ({
  inboxApi: {
    list: vi.fn(async () => ({ data: [], meta: { page: 1, pageSize: 1, total: 4 } })),
  },
}));
vi.mock('@/api/notifications.api', () => ({
  notificationsApi: {
    list: vi.fn(async () => ({ data: [], meta: { page: 1, pageSize: 10, total: 0, unread: 0 } })),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}));

describe('DashboardPage', () => {
  it('shows month tiles and the waiting count', async () => {
    const pinia = createTestingPinia({
      stubActions: false,
      createSpy: vi.fn,
      initialState: {
        auth: { user: makeUser({ id: 'u', level: 'finance', firstName: 'Fay', lastName: 'F' }) },
      },
    });
    const w = mount(DashboardPage, {
      global: {
        plugins: [
          pinia,
          [
            VueQueryPlugin,
            { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
          ],
        ],
      },
    });
    await flushPromises();
    await flushPromises();
    expect(w.text()).toContain('3.50');
    expect(w.text()).toContain('5.25');
    expect(w.text()).toContain('4');
    expect(w.text()).toContain('Ready for payment');
  });
});
