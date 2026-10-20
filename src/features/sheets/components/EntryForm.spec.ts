import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import { createTestingPinia } from '@pinia/testing';
import { useConfirmStore } from '@/composables/useConfirm';
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
  sheetsApi: {
    addEntry: vi.fn(async (_s: string, b: unknown) => ({
      id: 'e1',
      multiplier: 1.5,
      weightedHours: 1.5,
      overtimeType: { id: '11111111-1111-4111-8111-111111111111', name: 'Weekday', color: '#000' },
      requestedBy: null,
      attachment: null,
      ...(b as object),
    })),
  },
}));

describe('EntryForm', () => {
  it('shows field errors on empty submit and does not call the API', async () => {
    const w = mount(EntryForm, {
      props: { open: true, sheetId: 's1', period: '2026-09' },
      global: {
        plugins: [
          createTestingPinia({ stubActions: false, createSpy: vi.fn }),
          [VueQueryPlugin, { queryClient: new QueryClient() }],
        ],
      },
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
      global: {
        plugins: [
          createTestingPinia({ stubActions: false, createSpy: vi.fn }),
          [VueQueryPlugin, { queryClient: new QueryClient() }],
        ],
      },
      attachTo: document.body,
    });
    await flushPromises();
    expect((document.body.querySelector('#hours') as HTMLInputElement).value).toBe('3');
    const cancel = [...document.body.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === 'Cancel',
    );
    cancel!.click();
    await flushPromises();
    expect(useConfirmStore().open).toBe(false);
    w.unmount();
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
      global: {
        plugins: [
          createTestingPinia({ stubActions: false, createSpy: vi.fn }),
          [VueQueryPlugin, { queryClient: new QueryClient() }],
        ],
      },
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

  describe('reset behaviour', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      // jsdom lacks the pointer-capture and scroll APIs the Select popper uses.
      Element.prototype.hasPointerCapture ??= () => false;
      Element.prototype.setPointerCapture ??= () => undefined;
      Element.prototype.releasePointerCapture ??= () => undefined;
      Element.prototype.scrollIntoView ??= () => undefined;
    });
    function mountOpen() {
      return mount(EntryForm, {
        props: { open: true, sheetId: 's1', period: '2026-09' },
        global: {
          plugins: [
            createTestingPinia({ stubActions: false, createSpy: vi.fn }),
            [VueQueryPlugin, { queryClient: new QueryClient() }],
          ],
        },
        attachTo: document.body,
      });
    }
    function setField(sel: string, value: string) {
      const el = document.body.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement;
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    async function fillAndSubmit() {
      setField('#date', '2026-09-10');
      setField('#startTime', '18:00');
      setField('#endTime', '19:30');
      const trigger = document.body.querySelector('#overtimeTypeId') as HTMLElement;
      trigger.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, button: 0, ctrlKey: false, pointerType: 'mouse' }),
      );
      await flushPromises();
      const option = document.body.querySelector('[role="option"]') as HTMLElement;
      option.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerType: 'mouse' }));
      option.click();
      await flushPromises();
      setField('#workItem', 'E2E-1');
      setField('#description', 'Fixed the production incident');
      await flushPromises();
      (document.body.querySelector('form') as HTMLFormElement).dispatchEvent(
        new Event('submit', { cancelable: true }),
      );
      const { sheetsApi } = await import('@/api/sheets.api');
      await vi.waitFor(() => expect(sheetsApi.addEntry).toHaveBeenCalled());
      await flushPromises();
    }
    const val = (sel: string) => (document.body.querySelector(sel) as HTMLInputElement).value;

    it('clears after a successful add and keeps the drawer open', async () => {
      const w = mountOpen();
      await flushPromises();
      await fillAndSubmit();
      const { sheetsApi } = await import('@/api/sheets.api');
      expect(sheetsApi.addEntry).toHaveBeenCalled();
      expect(w.emitted('update:open')).toBeUndefined();
      expect(val('#workItem')).toBe('');
      expect(val('#hours')).toBe('');
      w.unmount();
    });

    it('derives hours again after a reset', async () => {
      const w = mountOpen();
      await flushPromises();
      await fillAndSubmit();
      setField('#startTime', '18:00');
      setField('#endTime', '21:00');
      await flushPromises();
      expect(val('#hours')).toBe('3');
      w.unmount();
    });

    it('closing while dirty and reopening shows a blank form', async () => {
      const w = mountOpen();
      await flushPromises();
      setField('#workItem', 'DIRTY-1');
      await flushPromises();
      await w.setProps({ open: false });
      await w.setProps({ open: true });
      await flushPromises();
      expect(val('#workItem')).toBe('');
      w.unmount();
    });

    it("reopening in edit mode after an add shows that entry's values", async () => {
      const w = mountOpen();
      await flushPromises();
      await fillAndSubmit();
      const { sheetsApi } = await import('@/api/sheets.api');
      const savedEntry = await (sheetsApi.addEntry as ReturnType<typeof vi.fn>).mock.results[0].value;
      await w.setProps({ open: false });
      await w.setProps({ open: true, entry: savedEntry });
      await flushPromises();
      expect(val('#workItem')).toBe('E2E-1');
      expect(document.body.textContent).toContain('Edit entry');
      w.unmount();
    });

    it('offers an "Add attachment" toast action that emits attach with the saved entry', async () => {
      const { useToast } = await import('@/components/ui/useToast');
      const { toasts } = useToast();
      toasts.value = [];
      const w = mountOpen();
      await flushPromises();
      await fillAndSubmit();
      const { sheetsApi } = await import('@/api/sheets.api');
      const savedEntry = await (sheetsApi.addEntry as ReturnType<typeof vi.fn>).mock.results[0].value;
      const t = toasts.value.find((x) => x.title === 'Entry added');
      expect(t?.action?.label).toBe('Add attachment');
      t!.action!.onClick();
      expect(w.emitted('attach')?.[0]).toEqual([savedEntry]);
      w.unmount();
    });

    it('populates when entry is set while the drawer is already open', async () => {
      const w = mountOpen();
      await flushPromises();
      await fillAndSubmit();
      const { sheetsApi } = await import('@/api/sheets.api');
      const savedEntry = await (sheetsApi.addEntry as ReturnType<typeof vi.fn>).mock.results[0].value;
      expect(val('#workItem')).toBe('');
      await w.setProps({ entry: savedEntry });
      await flushPromises();
      expect(val('#workItem')).toBe('E2E-1');
      expect(document.body.textContent).toContain('Edit entry');
      w.unmount();
    });
  });
});
