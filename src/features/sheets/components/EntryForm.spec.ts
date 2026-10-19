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
  usersApi: { directory: vi.fn(async () => []) },
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

  it('keeps saved hours in edit mode and is not dirty', async () => {
    const confirmSpy = vi.fn(() => true);
    vi.stubGlobal('confirm', confirmSpy);
    const entry = {
      id: 'e1',
      date: '2026-09-10',
      startTime: '18:00',
      endTime: '20:30',
      hours: 3,
      multiplier: 1.5,
      weightedHours: 4.5,
      overtimeType: { id: '11111111-1111-4111-8111-111111111111', name: 'Weekday', color: '#000' },
      workItem: 'PROJ-1',
      workItemUrl: null,
      description: 'Hotfix for payments',
      requestedBy: null,
      attachment: null,
    };
    const w = mount(EntryForm, {
      props: { open: true, sheetId: 's1', period: '2026-09', entry },
      global: { plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]] },
      attachTo: document.body,
    });
    await flushPromises();
    expect((document.body.querySelector('#hours') as HTMLInputElement).value).toBe('3');
    const cancel = [...document.body.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Cancel',
    );
    cancel!.click();
    await flushPromises();
    expect(confirmSpy).not.toHaveBeenCalled();
    w.unmount();
    vi.unstubAllGlobals();
  });

  it('re-derives hours in edit mode when saved hours equal the time span', async () => {
    const entry = {
      id: 'e2',
      date: '2026-09-10',
      startTime: '18:00',
      endTime: '20:30',
      hours: 2.5,
      multiplier: 1.5,
      weightedHours: 3.75,
      overtimeType: { id: '11111111-1111-4111-8111-111111111111', name: 'Weekday', color: '#000' },
      workItem: 'PROJ-1',
      workItemUrl: null,
      description: 'Hotfix for payments',
      requestedBy: null,
      attachment: null,
    };
    const w = mount(EntryForm, {
      props: { open: true, sheetId: 's1', period: '2026-09', entry },
      global: { plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]] },
      attachTo: document.body,
    });
    await flushPromises();
    const end = document.body.querySelector('#endTime') as HTMLInputElement;
    end.value = '21:30';
    end.dispatchEvent(new Event('input', { bubbles: true }));
    await flushPromises();
    expect((document.body.querySelector('#hours') as HTMLInputElement).value).toBe('3.5');
    w.unmount();
  });
});
