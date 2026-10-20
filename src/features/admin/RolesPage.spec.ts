import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import { useConfirmStore } from '@/composables/useConfirm';
import type { RoleView } from '@/api/types';
import RolesPage from './RolesPage.vue';

const mk = (o: Partial<RoleView>): RoleView => ({
  id: 'x',
  name: 'X',
  level: 'employee',
  isSystem: false,
  systemKey: null,
  userCount: 0,
  createdAt: '',
  updatedAt: '',
  ...o,
});
const list = vi.fn();
const remove = vi.fn();
vi.mock('@/api/roles.api', () => ({
  rolesApi: {
    list: (...a: unknown[]) => list(...a),
    remove: (...a: unknown[]) => remove(...a),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

const mountPage = () =>
  mount(RolesPage, {
    global: {
      plugins: [
        createTestingPinia({ stubActions: false, createSpy: vi.fn }),
        [VueQueryPlugin, { queryClient: new QueryClient() }],
      ],
    },
    attachTo: document.body,
  });
const openMenu = async (name: string) => {
  const trigger = document.body.querySelector(`[aria-label="Actions for ${name}"]`) as HTMLElement;
  trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  await flushPromises();
};
const menuItems = () =>
  [...document.body.querySelectorAll('[role="menuitem"]')].map((e) => e.textContent?.trim());

beforeEach(() => {
  document.body.innerHTML = '';
  list.mockReset();
  remove.mockReset();
  list.mockResolvedValue([
    mk({ id: 'r-emp', name: 'Employee', level: 'employee', isSystem: true, userCount: 4 }),
    mk({ id: 'r-qa', name: 'QA Lead', level: 'manager', userCount: 0 }),
  ]);
});

describe('RolesPage', () => {
  it('renders a row per role with the level label', async () => {
    const w = mountPage();
    await flushPromises();
    expect(w.findAll('tbody tr')).toHaveLength(2);
    expect(w.text()).toContain('QA Lead');
    expect(w.text()).toContain('Manager');
    expect(w.text()).toContain('Employee');
    w.unmount();
  });

  it('marks system roles as Built-in', async () => {
    const w = mountPage();
    await flushPromises();
    const rows = w.findAll('tbody tr');
    expect(rows[0].text()).toContain('Built-in');
    expect(rows[1].text()).not.toContain('Built-in');
    w.unmount();
  });

  it('hides Delete for system roles and shows it for custom roles', async () => {
    const w = mountPage();
    await flushPromises();
    await openMenu('Employee');
    expect(menuItems()).toEqual(['Edit']);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await flushPromises();
    await openMenu('QA Lead');
    expect(menuItems()).toContain('Delete');
    w.unmount();
  });

  it('confirms before deleting, then removes by id', async () => {
    remove.mockResolvedValueOnce(undefined);
    const w = mountPage();
    await flushPromises();
    await openMenu('QA Lead');
    const del = [...document.body.querySelectorAll('[role="menuitem"]')].find(
      (e) => e.textContent?.trim() === 'Delete',
    ) as HTMLElement;
    del.click();
    await flushPromises();
    const store = useConfirmStore();
    expect(store.open).toBe(true);
    expect(remove).not.toHaveBeenCalled();
    store.settle(true);
    await flushPromises();
    expect(remove).toHaveBeenCalledWith('r-qa');
    w.unmount();
  });
});
