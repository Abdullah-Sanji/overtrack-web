import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import ProfilePage from './ProfilePage.vue';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/auth.store';

const push = vi.fn();
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/api/auth.api', () => ({
  authApi: { updateMe: vi.fn(), changePassword: vi.fn(), logout: vi.fn() },
}));

const user = {
  id: 'u',
  role: 'employee',
  firstName: 'Eve',
  lastName: 'P',
  email: 'e@x.y',
  employeeCode: 'E1',
  timezone: 'UTC',
};

function mountPage() {
  const pinia = createTestingPinia({
    stubActions: false,
    createSpy: vi.fn,
    initialState: { auth: { user } },
  });
  return mount(ProfilePage, { global: { plugins: [pinia] } });
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pre-fills and saves the profile', async () => {
    vi.mocked(authApi.updateMe).mockResolvedValue({ ...user, firstName: 'Evelyn' } as never);
    const w = mountPage();
    const first = w.find('#firstName');
    expect((first.element as HTMLInputElement).value).toBe('Eve');
    await first.setValue('Evelyn');
    await w.findAll('form')[0]!.trigger('submit');
    await flushPromises();
    await vi.waitFor(() =>
      expect(authApi.updateMe).toHaveBeenCalledWith({ firstName: 'Evelyn', lastName: 'P', timezone: 'UTC' }),
    );
    await vi.waitFor(() => expect(useAuthStore().user?.firstName).toBe('Evelyn'));
  });

  it('rejects a mismatched confirmation', async () => {
    const w = mountPage();
    const pws = ['#currentPassword', '#newPassword', '#confirm'].map((id) => w.find(id));
    await pws[0]!.setValue('Password123!');
    await pws[1]!.setValue('NewPassword123!');
    await pws[2]!.setValue('Different12345');
    await w.findAll('form')[1]!.trigger('submit');
    await flushPromises();
    await vi.waitFor(() => expect(w.text()).toContain('Passwords do not match'));
    expect(authApi.changePassword).not.toHaveBeenCalled();
  });

  it('signs out and redirects after a password change', async () => {
    vi.mocked(authApi.changePassword).mockResolvedValue(undefined);
    const w = mountPage();
    const auth = useAuthStore();
    const logout = vi.spyOn(auth, 'logout').mockResolvedValue(undefined);
    const pws = ['#currentPassword', '#newPassword', '#confirm'].map((id) => w.find(id));
    await pws[0]!.setValue('Password123!');
    await pws[1]!.setValue('NewPassword123!');
    await pws[2]!.setValue('NewPassword123!');
    await w.findAll('form')[1]!.trigger('submit');
    await flushPromises();
    await vi.waitFor(() =>
      expect(authApi.changePassword).toHaveBeenCalledWith('Password123!', 'NewPassword123!'),
    );
    await vi.waitFor(() => expect(logout).toHaveBeenCalled());
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith({ name: 'login' }));
    expect((w.find('#currentPassword').element as HTMLInputElement).value).toBe('');
  });
});
