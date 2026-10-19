import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import EntryForm from './EntryForm.vue';

vi.mock('@/api/overtime-types.api', () => ({
  overtimeTypesApi: {
    list: vi.fn(async () => [
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Weekday',
        multiplier: 1.5,
        color: '#000',
        sortOrder: 1,
        isActive: true,
      },
    ]),
  },
}));
vi.mock('@/api/users.api', () => ({
  usersApi: { list: vi.fn(async () => ({ data: [], meta: { page: 1, pageSize: 100, total: 0 } })) },
}));
vi.mock('@/api/sheets.api', () => ({
  sheetsApi: { addEntry: vi.fn(async (_s: string, b: unknown) => ({ id: 'e1', ...(b as object) })) },
}));

describe('EntryForm', () => {
  it('shows field errors on empty submit and does not call the API', async () => {
    const w = mount(EntryForm, {
      props: { open: true, sheetId: 's1', period: '2026-09' },
      global: { plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]] },
      attachTo: document.body,
    });
    await flushPromises();
    (document.body.querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit', { cancelable: true }),
    );
    await flushPromises();
    const { sheetsApi } = await import('@/api/sheets.api');
    expect(sheetsApi.addEntry).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(document.body.textContent).toContain('Pick a date'));
    w.unmount();
  });
});
