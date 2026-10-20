import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import UserFormDrawer from './UserFormDrawer.vue';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import { ApiError } from '@/api/errors';
import { ROLES } from '@/test/fixtures';

const create = vi.fn();
vi.mock('@/api/users.api', () => ({
  usersApi: { create: (...a: unknown[]) => create(...a), update: vi.fn() },
}));

const rolesList = vi.fn();
vi.mock('@/api/roles.api', () => ({ rolesApi: { list: (...a: unknown[]) => rolesList(...a) } }));
const plugins = () => [
  [VueQueryPlugin, { queryClient: new QueryClient() }] as [typeof VueQueryPlugin, unknown],
];
const mountDrawer = () =>
  mount(UserFormDrawer, {
    props: { open: true, teams: [] },
    global: { plugins: plugins() },
    attachTo: document.body,
  });

beforeEach(() => {
  create.mockReset();
  rolesList.mockReset();
  rolesList.mockResolvedValue(Object.values(ROLES));
});

describe('UserFormDrawer', () => {
  it('validates, then maps EMAIL_TAKEN to the email field', async () => {
    create.mockRejectedValueOnce(new ApiError(409, 'EMAIL_TAKEN', 'x'));
    const w = mountDrawer();
    await flushPromises();
    const form = document.body.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await vi.waitFor(() => expect(document.body.textContent).toContain('Enter a first name'));
    expect(create).not.toHaveBeenCalled();
    const set = (name: string, v: string) => {
      const el = document.body.querySelector(`[name="${name}"]`) as HTMLInputElement;
      el.value = v;
      el.dispatchEvent(new Event('input'));
    };
    set('firstName', 'Nora');
    set('lastName', 'K');
    set('email', 'nora@t.local');
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await vi.waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][0]).toMatchObject({ roleId: 'r-emp' });
    await vi.waitFor(() => expect(document.body.textContent).toContain('already in use'));
    w.unmount();
  });

  const clickCancel = () => {
    const btn = [...document.body.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Cancel');
    btn!.click();
  };

  it('Cancel with unsaved changes asks for confirmation and stays open when declined', async () => {
    const confirmSpy = vi.fn(() => false);
    vi.stubGlobal('confirm', confirmSpy);
    const w = mountDrawer();
    const el = document.body.querySelector('[name="firstName"]') as HTMLInputElement;
    el.value = 'Nora';
    el.dispatchEvent(new Event('input'));
    await flushPromises();
    clickCancel();
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(w.emitted('update:open')).toBeUndefined();
    w.unmount();
    vi.unstubAllGlobals();
  });

  it('Cancel with a clean form closes without confirmation', async () => {
    const confirmSpy = vi.fn(() => false);
    vi.stubGlobal('confirm', confirmSpy);
    const w = mountDrawer();
    await flushPromises();
    clickCancel();
    await vi.waitFor(() => expect(w.emitted('update:open')).toEqual([[false]]));
    expect(confirmSpy).not.toHaveBeenCalled();
    w.unmount();
    vi.unstubAllGlobals();
  });

  it('reopening as a new user keeps the default role and a clean form', async () => {
    const confirmSpy = vi.fn(() => false);
    vi.stubGlobal('confirm', confirmSpy);
    const w = mountDrawer();
    await flushPromises();
    await w.setProps({ open: false });
    await w.setProps({ open: true });
    await flushPromises();
    clickCancel();
    await vi.waitFor(() => expect(w.emitted('update:open')).toEqual([[false]]));
    expect(confirmSpy).not.toHaveBeenCalled();
    create.mockResolvedValueOnce({ id: 'n' });
    for (const [name, v] of [
      ['firstName', 'Nora'],
      ['lastName', 'K'],
      ['email', 'nora@t.local'],
    ]) {
      const el = document.body.querySelector(`[name="${name}"]`) as HTMLInputElement;
      el.value = v;
      el.dispatchEvent(new Event('input'));
    }
    document.body.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await vi.waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][0]).toMatchObject({ roleId: 'r-emp' });
    w.unmount();
    vi.unstubAllGlobals();
  });

  it('submit is disabled until roles load', async () => {
    rolesList.mockReturnValue(new Promise(() => {}));
    const w = mountDrawer();
    await flushPromises();
    const btn = [...document.body.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Send invite',
    );
    expect(btn!.hasAttribute('disabled')).toBe(true);
    w.unmount();
  });
});
