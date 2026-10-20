import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import { createTestingPinia } from '@pinia/testing';
import ChainEditorPage from './ChainEditorPage.vue';
import { chainsApi } from '@/api/chains.api';

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
    get: vi.fn(async (): Promise<unknown[]> => []),
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
  it('starts empty with a warning, adds steps, reorders them and saves in order', async () => {
    const w = mount(ChainEditorPage, {
      props: { id: 't1' },
      global: {
        plugins: [
          createTestingPinia({ stubActions: false, createSpy: vi.fn }),
          [VueQueryPlugin, { queryClient: new QueryClient() }],
        ],
      },
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

  it('warns about inactive approvers and labels them in the options', async () => {
    vi.mocked(chainsApi.get).mockResolvedValueOnce([
      {
        id: 's1',
        position: 1,
        label: 'TL',
        approver: { id: 'u9', firstName: 'Old', lastName: 'Timer', isActive: false },
        backupApprover: null,
      },
    ]);
    const w = mount(ChainEditorPage, {
      props: { id: 't1' },
      global: {
        plugins: [
          createTestingPinia({ stubActions: false, createSpy: vi.fn }),
          [VueQueryPlugin, { queryClient: new QueryClient() }],
        ],
      },
    });
    await flushPromises();
    expect(w.text()).toContain('approvers on this chain are inactive');
    const input = w.find('input[id^="approver-"]').element as HTMLInputElement;
    expect(input.value).toContain('Old Timer (inactive)');
  });

  async function mountEditor() {
    replace.mockClear();
    const w = mount(ChainEditorPage, {
      props: { id: 't1' },
      global: {
        plugins: [
          createTestingPinia({ stubActions: false, createSpy: vi.fn }),
          [VueQueryPlugin, { queryClient: new QueryClient() }],
        ],
      },
    });
    await flushPromises();
    await w.find('[data-action="add-step"]').trigger('click');
    const vm = w.vm as unknown as {
      steps: Array<{ label: string; approverId: string | null; backupApproverId: string | null }>;
    };
    return { w, step: vm.steps[0] };
  }
  async function trySave(w: Awaited<ReturnType<typeof mountEditor>>['w']) {
    await flushPromises();
    await w.find('[data-action="save"]').trigger('click');
    await flushPromises();
  }

  it('blocks save and shows an error when the approver is missing', async () => {
    const { w, step } = await mountEditor();
    step.label = 'TL';
    await trySave(w);
    expect(replace).not.toHaveBeenCalled();
    expect(w.text()).toContain('Pick an approver');
  });

  it('blocks save when the label is longer than 40 characters', async () => {
    const { w, step } = await mountEditor();
    step.label = 'x'.repeat(41);
    step.approverId = 'u1';
    await trySave(w);
    expect(replace).not.toHaveBeenCalled();
    expect(w.text()).toContain('At most 40 characters');
  });

  it('blocks save when the backup equals the approver', async () => {
    const { w, step } = await mountEditor();
    step.label = 'TL';
    step.approverId = 'u1';
    step.backupApproverId = 'u1';
    await trySave(w);
    expect(replace).not.toHaveBeenCalled();
    expect(w.text()).toContain('Backup must differ from the approver');
  });
});
