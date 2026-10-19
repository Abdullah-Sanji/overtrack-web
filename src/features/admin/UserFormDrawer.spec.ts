import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import UserFormDrawer from './UserFormDrawer.vue';
import { ApiError } from '@/api/errors';

const create = vi.fn();
vi.mock('@/api/users.api', () => ({
  usersApi: { create: (...a: unknown[]) => create(...a), update: vi.fn() },
}));

describe('UserFormDrawer', () => {
  it('validates, then maps EMAIL_TAKEN to the email field', async () => {
    create.mockRejectedValueOnce(new ApiError(409, 'EMAIL_TAKEN', 'x'));
    const w = mount(UserFormDrawer, { props: { open: true, teams: [] }, attachTo: document.body });
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
    const w = mount(UserFormDrawer, { props: { open: true, teams: [] }, attachTo: document.body });
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
    const w = mount(UserFormDrawer, { props: { open: true, teams: [] }, attachTo: document.body });
    clickCancel();
    await vi.waitFor(() => expect(w.emitted('update:open')).toEqual([[false]]));
    expect(confirmSpy).not.toHaveBeenCalled();
    w.unmount();
    vi.unstubAllGlobals();
  });
});
