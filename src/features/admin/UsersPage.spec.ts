import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import { useConfirmStore } from '@/composables/useConfirm';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/components/ui/useToast';
import { ApiError } from '@/api/errors';
import { makeUser, ROLES } from '@/test/fixtures';
import { Select } from '@/components/ui';
import UsersPage from './UsersPage.vue';

const list = vi.fn();
const remove = vi.fn();
vi.mock('@/api/users.api', () => ({
  usersApi: {
    list: (...a: unknown[]) => list(...a),
    remove: (...a: unknown[]) => remove(...a),
    resendInvite: vi.fn(),
    departments: vi.fn().mockResolvedValue(['Design', 'Engineering']),
    deactivate: vi.fn(),
    reactivate: vi.fn(),
  },
}));
vi.mock('@/api/teams.api', () => ({
  teamsApi: { list: vi.fn().mockResolvedValue({ data: [], meta: { page: 1, pageSize: 100, total: 0 } }) },
}));
vi.mock('@/api/roles.api', () => ({
  rolesApi: { list: vi.fn().mockResolvedValue(Object.values(ROLES)) },
}));

const mountPage = () => {
  const w = mount(UsersPage, {
    global: {
      plugins: [
        createTestingPinia({ stubActions: false, createSpy: vi.fn }),
        [VueQueryPlugin, { queryClient: new QueryClient() }],
      ],
    },
    attachTo: document.body,
  });
  useAuthStore().setUser(makeUser({ level: 'admin', id: 'me' }));
  return w;
};
const openMenu = async (index: number) => {
  const trigger = document.body.querySelectorAll('[aria-label="Actions"]')[index] as HTMLElement;
  trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  await flushPromises();
};
const items = () => [...document.body.querySelectorAll('[role="menuitem"]')] as HTMLElement[];

beforeEach(() => {
  document.body.innerHTML = '';
  list.mockReset();
  remove.mockReset();
  useToast().toasts.value = [];
  list.mockResolvedValue({
    data: [
      makeUser({ level: 'admin', id: 'me', firstName: 'Me', email: 'me@t.local' }),
      makeUser({ id: 'u2', firstName: 'Bob', email: 'bob@t.local' }),
    ],
    meta: { page: 1, pageSize: 20, total: 2 },
  });
});

describe('UsersPage department', () => {
  it('department filter sends the value and resets the page', async () => {
    list.mockResolvedValue({
      data: [makeUser({ department: 'Design' })],
      meta: { page: 1, pageSize: 20, total: 1 },
    });
    const w = mountPage();
    await flushPromises();
    expect(w.text()).toContain('Design'); // column
    const select = w
      .findAllComponents(Select)
      .find((c) => c.props('options').some((o: { label: string }) => o.label === 'Engineering'))!;
    select.vm.$emit('update:modelValue', 'Engineering');
    await flushPromises();
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ department: 'Engineering', page: 1 }));
    w.unmount();
  });
});

describe('UsersPage delete', () => {
  it('hides Delete on the signed-in admin row', async () => {
    const w = mountPage();
    await flushPromises();
    await openMenu(0);
    expect(items().map((e) => e.textContent?.trim())).not.toContain('Delete');
    w.unmount();
  });

  it('confirms, then removes another user', async () => {
    remove.mockResolvedValueOnce(undefined);
    const w = mountPage();
    await flushPromises();
    await openMenu(1);
    items()
      .find((e) => e.textContent?.trim() === 'Delete')!
      .click();
    await flushPromises();
    const store = useConfirmStore();
    expect(store.open).toBe(true);
    expect(remove).not.toHaveBeenCalled();
    store.settle(true);
    await flushPromises();
    expect(remove).toHaveBeenCalledWith('u2');
    w.unmount();
  });

  it('offers Deactivate instead when the user has history', async () => {
    remove.mockRejectedValueOnce(new ApiError(409, 'USER_HAS_HISTORY', 'has history'));
    const w = mountPage();
    await flushPromises();
    await openMenu(1);
    items()
      .find((e) => e.textContent?.trim() === 'Delete')!
      .click();
    await flushPromises();
    useConfirmStore().settle(true);
    await flushPromises();
    expect(useToast().toasts.value.map((t) => t.action?.label)).toContain('Deactivate instead');
    w.unmount();
  });
});
