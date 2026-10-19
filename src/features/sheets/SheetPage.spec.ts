import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import SheetPage from './SheetPage.vue';

vi.mock('vue-router', () => ({
  RouterLink: { template: '<a><slot/></a>' },
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('@/api/overtime-types.api', () => ({ overtimeTypesApi: { list: vi.fn(async () => []) } }));
vi.mock('@/api/users.api', () => ({
  usersApi: { list: vi.fn(async () => ({ data: [], meta: { page: 1, pageSize: 100, total: 0 } })) },
}));
vi.mock('@/api/sheets.api', () => ({
  sheetsApi: {
    get: vi.fn(async () => ({
      id: 's1',
      period: '2026-09',
      status: 'draft',
      round: 1,
      totalHours: 2.5,
      totalWeightedHours: 3.75,
      paymentReference: null,
      version: 1,
      employee: { id: 'me', firstName: 'Em', lastName: 'Ployee', teamName: null },
      steps: [],
      entries: [
        {
          id: 'e1',
          date: '2026-09-10',
          startTime: '18:00',
          endTime: '20:30',
          hours: 2.5,
          multiplier: 1.5,
          weightedHours: 3.75,
          overtimeType: { id: 't1', name: 'Weekday', color: '#000' },
          workItem: 'PROJ-1',
          workItemUrl: null,
          description: 'Hotfix for payments',
          requestedBy: null,
          attachment: null,
        },
      ],
    })),
    deleteEntry: vi.fn(async () => undefined),
    openAttachment: vi.fn(),
  },
}));

describe('SheetPage', () => {
  it('deletes an entry after confirmation', async () => {
    const pinia = createTestingPinia({
      stubActions: false,
      createSpy: vi.fn,
      initialState: { auth: { user: { id: 'me', role: 'employee', firstName: 'Em', lastName: 'Ployee' } } },
    });
    const w = mount(SheetPage, {
      props: { id: 's1' },
      global: { plugins: [pinia, [VueQueryPlugin, { queryClient: new QueryClient() }]] },
      attachTo: document.body,
    });
    await flushPromises();
    (document.body.querySelector('[aria-label="Delete entry"]') as HTMLElement).click();
    await flushPromises();
    (document.body.querySelector('[data-confirm]') as HTMLElement).click();
    await flushPromises();
    const { sheetsApi } = await import('@/api/sheets.api');
    expect(sheetsApi.deleteEntry).toHaveBeenCalledWith('s1', 'e1');
    w.unmount();
  });
});
