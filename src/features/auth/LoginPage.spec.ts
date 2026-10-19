import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import LoginPage from './LoginPage.vue';

const push = vi.fn();
const mockRoute: { query: Record<string, string> } = { query: {} };
vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  useRoute: () => mockRoute,
  RouterLink: { template: '<a><slot/></a>' },
}));

async function signIn() {
  const pinia = createTestingPinia({ stubActions: true, createSpy: vi.fn });
  const w = mount(LoginPage, { global: { plugins: [pinia] } });
  await w.find('form').trigger('submit');
  await flushPromises();
  await vi.waitFor(() => expect(w.text()).toContain('Enter a valid email'));
  await w.find('input[type="email"]').setValue('a@b.co');
  await w.find('input[type="password"]').setValue('Password123!');
  await w.find('form').trigger('submit');
  await flushPromises();
  await vi.waitFor(() => expect(push).toHaveBeenCalled());
  const { useAuthStore } = await import('@/stores/auth.store');
  expect(useAuthStore().login).toHaveBeenCalledWith('a@b.co', 'Password123!');
}

describe('LoginPage', () => {
  beforeEach(() => {
    push.mockClear();
  });

  it('validates on submit and logs in then redirects', async () => {
    mockRoute.query = { redirect: '/sheets/9' };
    await signIn();
    expect(push).toHaveBeenCalledWith('/sheets/9');
  });

  it('ignores an off-site redirect and goes to the dashboard', async () => {
    mockRoute.query = { redirect: '//evil.com' };
    await signIn();
    expect(push).toHaveBeenCalledWith({ name: 'dashboard' });
  });
});
