import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { ApiError } from '@/api/errors';
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

describe('LoginPage without Google', () => {
  it('never loads the Google script and shows no alert after the timeout', async () => {
    vi.useFakeTimers();
    mockRoute.query = {};
    const w = mount(LoginPage, { global: { plugins: [createTestingPinia({ createSpy: vi.fn })] } });
    await flushPromises();
    expect(document.head.querySelector('script[src*="gsi"]')).toBeNull();
    await vi.advanceTimersByTimeAsync(6000);
    await flushPromises();
    expect(w.find('[role="alert"]').exists()).toBe(false);
    expect(w.find('form').exists()).toBe(true);
    vi.useRealTimers();
  });
});

describe('LoginPage blur validation', () => {
  it('shows the email error on blur without submitting', async () => {
    mockRoute.query = {};
    const w = mount(LoginPage, { global: { plugins: [createTestingPinia({ createSpy: vi.fn })] } });
    const input = w.find('input[type="email"]');
    await input.setValue('nope');
    await input.trigger('blur');
    await vi.waitFor(() => expect(w.text()).toContain('Enter a valid email'));
  });
});

describe('LoginPage with Google', () => {
  const initialize = vi.fn();
  const renderButton = vi.fn();
  const mountWithGoogle = () =>
    mount(LoginPage, { global: { plugins: [createTestingPinia({ stubActions: true, createSpy: vi.fn })] } });
  const credentialCallback = () =>
    initialize.mock.calls[0][0].callback as (r: { credential: string }) => void;

  beforeEach(() => {
    push.mockClear();
    initialize.mockClear();
    renderButton.mockClear();
    mockRoute.query = {};
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'cid');
    (window as unknown as { google: unknown }).google = { accounts: { id: { initialize, renderButton } } };
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    delete (window as unknown as { google?: unknown }).google;
    vi.useRealTimers();
  });

  it('renders the Google button, hides the form until the link is clicked', async () => {
    const w = mountWithGoogle();
    await flushPromises();
    expect(initialize).toHaveBeenCalledWith(expect.objectContaining({ client_id: 'cid' }));
    expect(renderButton).toHaveBeenCalled();
    expect(w.text()).toContain('Sign in with your company Google account.');
    expect(w.find('form').exists()).toBe(false);
    await w
      .findAll('button')
      .find((b) => b.text() === 'Sign in with password')!
      .trigger('click');
    expect(w.find('input[type="email"]').exists()).toBe(true);
    expect(w.text()).not.toContain('Sign in with password');
  });

  it('redirects after Google sign-in and rejects off-site redirect', async () => {
    mockRoute.query = { redirect: '//evil.com' };
    mountWithGoogle();
    await flushPromises();
    credentialCallback()({ credential: 'tok' });
    await flushPromises();
    const { useAuthStore } = await import('@/stores/auth.store');
    expect(useAuthStore().loginWithGoogle).toHaveBeenCalledWith('tok');
    expect(push).toHaveBeenCalledWith({ name: 'dashboard' });
  });

  it('shows the API error from Google sign-in', async () => {
    const w = mountWithGoogle();
    await flushPromises();
    const { useAuthStore } = await import('@/stores/auth.store');
    (useAuthStore().loginWithGoogle as Mock).mockRejectedValueOnce(
      new ApiError(
        403,
        'GOOGLE_ACCOUNT_UNKNOWN',
        'No OverTrack account for this Google address. Ask your admin.',
      ),
    );
    credentialCallback()({ credential: 'tok' });
    await flushPromises();
    expect(w.find('[role="alert"]').text()).toContain(
      'No OverTrack account for this Google address. Ask your admin.',
    );
    expect(w.findAll('button').some((b) => b.text() === 'Sign in with password')).toBe(true);
  });

  it('reveals the password form when the script never loads', async () => {
    delete (window as unknown as { google?: unknown }).google;
    vi.useFakeTimers();
    const w = mountWithGoogle();
    await flushPromises();
    expect(w.find('form').exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(5000);
    await flushPromises();
    expect(w.find('[role="alert"]').text()).toContain('Google sign-in is unavailable');
    expect(w.find('input[type="email"]').exists()).toBe(true);
  });
});
