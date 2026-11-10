import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import MySheetsPage from './MySheetsPage.vue';
import { makeUser } from '@/test/fixtures';
import { currentPeriod } from '@/lib/dates';

const push = vi.fn();
vi.mock('vue-router', () => ({
  RouterLink: { template: '<a><slot/></a>' },
  useRouter: () => ({ push }),
}));
const forPeriod = vi.fn(async (period: string) => ({
  id: `sheet-${period}`,
  period,
  status: 'draft',
  totalHours: 0,
  totalWeightedHours: 0,
  version: 1,
}));
vi.mock('@/api/sheets.api', () => ({
  sheetsApi: {
    forPeriod: (p: string) => forPeriod(p),
    list: vi.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
  },
}));

function mountPage() {
  const pinia = createTestingPinia({
    stubActions: false,
    createSpy: vi.fn,
    initialState: { auth: { user: makeUser({ id: 'me' }) } },
  });
  return mount(MySheetsPage, {
    global: {
      plugins: [
        pinia,
        [VueQueryPlugin, { queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }],
      ],
    },
  });
}

describe('MySheetsPage', () => {
  beforeEach(() => {
    push.mockClear();
    forPeriod.mockClear();
  });

  it('defaults the month picker to the current month and caps it there', async () => {
    const w = mountPage();
    await flushPromises();
    const input = w.get('input[type="month"]').element as HTMLInputElement;
    expect(input.value).toBe(currentPeriod());
    expect(input.max).toBe(currentPeriod());
  });

  it('opens a sheet for a past month so entries can be added after the fact', async () => {
    const w = mountPage();
    await flushPromises();
    await w.get('input[type="month"]').setValue('2026-03');
    await w.get('button[data-testid="open-month"]').trigger('click');
    await flushPromises();
    expect(forPeriod).toHaveBeenCalledWith('2026-03');
    expect(push).toHaveBeenCalledWith({ name: 'sheet', params: { id: 'sheet-2026-03' } });
  });

  it('opens the current month when the picker is untouched', async () => {
    const w = mountPage();
    await flushPromises();
    await w.get('button[data-testid="open-month"]').trigger('click');
    await flushPromises();
    expect(forPeriod).toHaveBeenCalledWith(currentPeriod());
  });
});
