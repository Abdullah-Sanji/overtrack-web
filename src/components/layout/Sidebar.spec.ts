import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { createRouter, createMemoryHistory } from 'vue-router';
import Sidebar from './Sidebar.vue';
import { useAuthStore } from '@/stores/auth.store';
import { makeUser } from '@/test/fixtures';

const Stub = { template: '<div />' };
async function mountAt(path: string) {
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
        ],
      },
    ],
  });
  await router.push(path);
  await router.isReady();
  const pinia = createTestingPinia({ stubActions: false, createSpy: vi.fn });
  useAuthStore().setUser(makeUser({ level: 'employee' }));
  return mount(Sidebar, { global: { plugins: [router, pinia] } });
}

describe('Sidebar active state', () => {
  it('highlights only My sheets on a sheet page', async () => {
    const w = await mountAt('/sheets/123');
    const links = w.findAll('a');
    const current = links.filter((a) => a.attributes('aria-current') === 'page').map((a) => a.text());
    expect(current).toEqual(['My sheets']);
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
