import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import SheetActions from './SheetActions.vue';
import { ApiError } from '@/api/errors';
const submit = vi.fn();
vi.mock('@/api/workflow.api', () => ({
  workflowApi: { submit: (...a: unknown[]) => submit(...a), withdraw: vi.fn(), reopen: vi.fn() },
}));
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
const base = {
  id: 's1',
  version: 3,
  status: 'draft',
  steps: [],
  entries: [{ id: 'e' }],
  employee: { id: 'me' },
} as Record<string, unknown>;
const mountIt = (sheet: unknown, role = 'employee') =>
  mount(SheetActions, {
    props: {
      sheet: sheet as never,
      isOwner: true,
      role: role as never,
      invalidate: vi.fn(async () => {}),
    },
    global: { plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]] },
    attachTo: document.body,
  });
beforeEach(() => submit.mockReset());
describe('SheetActions', () => {
  it('shows Submit for a draft and sends the version after confirm', async () => {
    const w = mountIt(base);
    await w.find('[data-action="submit"]').trigger('click');
    (document.body.querySelector('[data-confirm]') as HTMLButtonElement).click();
    await flushPromises();
    expect(submit).toHaveBeenCalledWith('s1', 3);
    w.unmount();
  });
  it('shows no Submit on a paid sheet', () => {
    const w = mountIt({ ...base, status: 'paid' });
    expect(w.find('[data-action="submit"]').exists()).toBe(false);
    w.unmount();
  });
  it('on version conflict, toasts and calls invalidate; button stops spinning', async () => {
    submit.mockRejectedValueOnce(new ApiError(409, 'SHEET_VERSION_CONFLICT', 'x'));
    const w = mountIt(base);
    await w.find('[data-action="submit"]').trigger('click');
    (document.body.querySelector('[data-confirm]') as HTMLButtonElement).click();
    await flushPromises();
    expect(w.props('invalidate') as () => void).toHaveBeenCalled();
    expect(w.find('[data-action="submit"]').attributes('aria-busy')).toBeUndefined();
    const { useToast } = await import('@/components/ui/useToast');
    expect(useToast().toasts.value.at(-1)?.title).toContain('changed since you loaded it');
    w.unmount();
  });
});
