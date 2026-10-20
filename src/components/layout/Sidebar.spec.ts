import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { createRouter, createMemoryHistory } from 'vue-router';
import Sidebar from './Sidebar.vue';
import { useAuthStore } from '@/stores/auth.store';
import { makeUser } from '@/test/fixtures';

const Stub = { template: '<div />' };
async function mountAt(path: string, level: 'employee' | 'admin' = 'employee') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        children: [
          { name: 'dashboard', path: '', component: Stub },
          { name: 'my-sheets', path: 'sheets', component: Stub },
          { name: 'sheet', path: 'sheets/:id', component: Stub },
          { name: 'inbox', path: 'approvals', component: Stub },
          { name: 'review', path: 'approvals/:id', component: Stub },
          { name: 'admin-teams', path: 'admin/teams', component: Stub },
          { name: 'team-month', path: 'team-month', component: Stub },
          { name: 'payments', path: 'payments', component: Stub },
          { name: 'admin-users', path: 'admin/users', component: Stub },
          { name: 'admin-roles', path: 'admin/roles', component: Stub },
          { name: 'admin-overtime-types', path: 'admin/overtime-types', component: Stub },
          { name: 'admin-audit', path: 'admin/audit', component: Stub },
          { name: 'admin-chain', path: 'admin/teams/:id/chain', component: Stub },
        ],
      },
    ],
  });
  await router.push(path);
  await router.isReady();
  const pinia = createTestingPinia({ stubActions: false, createSpy: vi.fn });
  useAuthStore().setUser(makeUser({ level }));
  return mount(Sidebar, { global: { plugins: [router, pinia] } });
}

describe('Sidebar active state', () => {
  it('highlights only My sheets on a sheet page', async () => {
    const w = await mountAt('/sheets/123');
    const links = w.findAll('a');
    const current = links.filter((a) => a.attributes('aria-current') === 'page').map((a) => a.text());
    expect(current).toEqual(['My sheets']);
  });
  const currentAt = async (path: string, level: 'employee' | 'admin' = 'employee') =>
    (await mountAt(path, level))
      .findAll('a')
      .filter((a) => a.attributes('aria-current') === 'page')
      .map((a) => a.text());
  it('highlights only Inbox on a review page', async () => {
    expect(await currentAt('/approvals/9')).toEqual(['Inbox']);
  });
  it('highlights only Teams on a chain editor page', async () => {
    expect(await currentAt('/admin/teams/t1/chain', 'admin')).toEqual(['Teams']);
  });
  it('highlights Dashboard at /', async () => {
    const w = await mountAt('/');
    const current = w
      .findAll('a')
      .filter((a) => a.attributes('aria-current') === 'page')
      .map((a) => a.text());
    expect(current).toEqual(['Dashboard']);
  });
});
