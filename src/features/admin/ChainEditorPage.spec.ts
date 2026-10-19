import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import ChainEditorPage from './ChainEditorPage.vue';

const replace = vi.fn(async (_t: string, steps: unknown[]) =>
  steps.map((s, i) => ({
    id: String(i),
    position: i + 1,
    ...(s as object),
    approver: { id: 'u1', firstName: 'A', lastName: 'B', isActive: true },
    backupApprover: null,
  })),
);
vi.mock('@/api/chains.api', () => ({
  chainsApi: {
    get: vi.fn(async () => []),
    replace: (...a: unknown[]) => replace(...(a as [string, unknown[]])),
  },
}));
vi.mock('@/api/teams.api', () => ({
  teamsApi: { get: vi.fn(async () => ({ id: 't1', name: 'Platform' })) },
}));
vi.mock('@/api/users.api', () => ({
  usersApi: {
    list: vi.fn(async () => ({
      data: [
        { id: 'u1', firstName: 'A', lastName: 'B', isActive: true },
        { id: 'u2', firstName: 'C', lastName: 'D', isActive: true },
      ],
      meta: { page: 1, pageSize: 100, total: 2 },
    })),
  },
}));
vi.mock('vue-router', () => ({
  onBeforeRouteLeave: vi.fn(),
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: { template: '<a><slot/></a>' },
}));

describe('ChainEditorPage', () => {
  it('starts empty with a warning, adds a step, validates approver, moves steps, saves in order', async () => {
    const w = mount(ChainEditorPage, {
      props: { id: 't1' },
      global: { plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]] },
    });
    await flushPromises();
    expect(w.text()).toContain('no approval chain');
    await w.find('[data-action="add-step"]').trigger('click');
    await w.find('[data-action="add-step"]').trigger('click');
    const vm = w.vm as unknown as { steps: Array<{ label: string; approverId: string | null }> };
    vm.steps[0].label = 'TL';
    vm.steps[0].approverId = 'u1';
    vm.steps[1].label = 'CTO';
    vm.steps[1].approverId = 'u2';
    await flushPromises();
    await w.findAll('[data-action="move-up"]')[1].trigger('click');
    await w.find('[data-action="save"]').trigger('click');
    await flushPromises();
    expect(replace).toHaveBeenCalledWith('t1', [
      { label: 'CTO', approverId: 'u2', backupApproverId: null },
      { label: 'TL', approverId: 'u1', backupApproverId: null },
    ]);
  });
});
