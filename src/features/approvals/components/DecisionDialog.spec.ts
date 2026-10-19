import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import DecisionDialog from './DecisionDialog.vue';
describe('DecisionDialog', () => {
  it('reject requires a reason', async () => {
    const w = mount(DecisionDialog, {
      props: { open: true, kind: 'reject', requireOverrideReason: false },
      attachTo: document.body,
    });
    (document.body.querySelector('[data-confirm]') as HTMLButtonElement).click();
    await flushPromises();
    expect(w.emitted('confirm')).toBeUndefined();
    expect(document.body.textContent).toContain('at least 5 characters');
    const ta = document.body.querySelector('textarea') as HTMLTextAreaElement;
    ta.value = 'Missing ticket links';
    ta.dispatchEvent(new Event('input'));
    (document.body.querySelector('[data-confirm]') as HTMLButtonElement).click();
    await flushPromises();
    expect(w.emitted('confirm')?.[0]).toEqual([
      { comment: 'Missing ticket links', overrideReason: undefined },
    ]);
    w.unmount();
  });
  it('approve with override requires an override reason', async () => {
    const w = mount(DecisionDialog, {
      props: { open: true, kind: 'approve', requireOverrideReason: true },
      attachTo: document.body,
    });
    (document.body.querySelector('[data-confirm]') as HTMLButtonElement).click();
    await flushPromises();
    expect(w.emitted('confirm')).toBeUndefined();
    w.unmount();
  });
});
