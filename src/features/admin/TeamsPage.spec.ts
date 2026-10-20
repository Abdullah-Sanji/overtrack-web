import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import { createRouter, createMemoryHistory } from 'vue-router';
import { useConfirmStore } from '@/composables/useConfirm';
import { useToast } from '@/components/ui/useToast';
import { ApiError, messageFor } from '@/api/errors';
import type { TeamSummary } from '@/api/types';
import TeamsPage from './TeamsPage.vue';

const mk = (o: Partial<TeamSummary>): TeamSummary => ({
  id: 't1',
  name: 'Alpha',
  description: null,
  isActive: true,
  techLead: null,
  memberCount: 0,
  chainStepCount: 1,
  createdAt: '',
  updatedAt: '',
  ...o,
});
const list = vi.fn();
const remove = vi.fn();
vi.mock('@/api/teams.api', () => ({
  teamsApi: { list: (...a: unknown[]) => list(...a), remove: (...a: unknown[]) => remove(...a) },
}));

const mountPage = () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/chain/:id', name: 'admin-chain', component: { template: '<div />' } },
    ],
  });
  return mount(TeamsPage, {
    global: {
      plugins: [
        createTestingPinia({ stubActions: false, createSpy: vi.fn }),
        [VueQueryPlugin, { queryClient: new QueryClient() }],
        router,
      ],
    },
    attachTo: document.body,
  });
};
const delBtn = (name: string) =>
  document.body.querySelector(`[aria-label="Delete team ${name}"]`) as HTMLElement | null;

beforeEach(() => {
  document.body.innerHTML = '';
  list.mockReset();
  remove.mockReset();
  useToast().toasts.value = [];
  list.mockResolvedValue({
    data: [mk({}), mk({ id: 't2', name: 'Beta' })],
    meta: { page: 1, pageSize: 20, total: 2 },
  });
});

describe('TeamsPage delete', () => {
  it('renders a delete button per row', async () => {
    const w = mountPage();
    await flushPromises();
    expect(delBtn('Alpha')).not.toBeNull();
    expect(delBtn('Beta')).not.toBeNull();
    w.unmount();
  });

  it('confirms, then removes by id', async () => {
    remove.mockResolvedValueOnce(undefined);
    const w = mountPage();
    await flushPromises();
    delBtn('Beta')!.click();
    await flushPromises();
    const store = useConfirmStore();
    expect(store.open).toBe(true);
    expect(remove).not.toHaveBeenCalled();
    store.settle(true);
    await flushPromises();
    expect(remove).toHaveBeenCalledWith('t2');
    w.unmount();
  });

  it('shows the mapped message on TEAM_IN_USE', async () => {
    const err = new ApiError(409, 'TEAM_IN_USE', 'in use');
    remove.mockRejectedValueOnce(err);
    const w = mountPage();
    await flushPromises();
    delBtn('Alpha')!.click();
    await flushPromises();
    useConfirmStore().settle(true);
    await flushPromises();
    expect(useToast().toasts.value.map((t) => t.title)).toContain(messageFor(err));
    w.unmount();
  });
});
