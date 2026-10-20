import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import RoleFormDrawer from './RoleFormDrawer.vue';
import type { RoleView } from '@/api/types';

const create = vi.fn();
const update = vi.fn();
vi.mock('@/api/roles.api', () => ({
  rolesApi: {
    create: (...a: unknown[]) => create(...a),
    update: (...a: unknown[]) => update(...a),
  },
}));

const mountDrawer = (role?: RoleView | null) =>
  mount(RoleFormDrawer, {
    props: { open: true, role },
    global: { plugins: [createTestingPinia({ stubActions: false, createSpy: vi.fn })] },
    attachTo: document.body,
  });
const setName = (v: string) => {
  const el = document.body.querySelector('[name="name"]') as HTMLInputElement;
  el.value = v;
  el.dispatchEvent(new Event('input'));
};
const submit = () =>
  document.body.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
const systemRole: RoleView = {
  id: 'r-emp',
  name: 'Employee',
  level: 'employee',
  isSystem: true,
  systemKey: 'employee',
  userCount: 3,
  createdAt: '',
  updatedAt: '',
};

beforeEach(() => {
  // jsdom lacks the pointer-capture and scroll APIs the Select popper uses.
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => undefined;
  Element.prototype.releasePointerCapture ??= () => undefined;
  Element.prototype.scrollIntoView ??= () => undefined;
  create.mockReset();
  update.mockReset();
  document.body.innerHTML = '';
});

describe('RoleFormDrawer', () => {
  it('rejects a name shorter than 2 characters without calling the API', async () => {
    const w = mountDrawer();
    await flushPromises();
    setName('A');
    submit();
    await vi.waitFor(() => expect(document.body.textContent).toContain('At least 2 characters'));
    expect(create).not.toHaveBeenCalled();
    w.unmount();
  });

  it('creates a role with the chosen level', async () => {
    create.mockResolvedValueOnce({ id: 'n' });
    const w = mountDrawer();
    await flushPromises();
    setName('QA Lead');
    const trigger = document.body.querySelector('#level') as HTMLElement;
    trigger.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, button: 0, ctrlKey: false, pointerType: 'mouse' }),
    );
    await flushPromises();
    const option = [...document.body.querySelectorAll('[role="option"]')].find((o) =>
      o.textContent?.includes('Manager'),
    ) as HTMLElement;
    option.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerType: 'mouse' }));
    option.click();
    await flushPromises();
    submit();
    await vi.waitFor(() => expect(create).toHaveBeenCalled());
    expect(create).toHaveBeenCalledWith({ name: 'QA Lead', level: 'manager' });
    w.unmount();
  });

  it('sends only the name when editing a system role', async () => {
    update.mockResolvedValueOnce({ ...systemRole, name: 'Staff' });
    const w = mountDrawer(systemRole);
    await flushPromises();
    expect(document.body.textContent).toContain('Built-in roles keep their level.');
    setName('Staff');
    submit();
    await vi.waitFor(() => expect(update).toHaveBeenCalled());
    expect(update).toHaveBeenCalledWith('r-emp', { name: 'Staff' });
    w.unmount();
  });
});
