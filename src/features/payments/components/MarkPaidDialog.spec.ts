import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import MarkPaidDialog from './MarkPaidDialog.vue';

const sheets = [
  { id: 'a', totalWeightedHours: 3, employee: { firstName: 'A', lastName: 'B' } },
  { id: 'b', totalWeightedHours: 4.5, employee: { firstName: 'C', lastName: 'D' } },
] as never[];

describe('MarkPaidDialog', () => {
  it('requires a reference and emits reference + date', async () => {
    const w = mount(MarkPaidDialog, { props: { open: true, sheets }, attachTo: document.body });
    expect(document.body.textContent).toContain('2 sheets');
    expect(document.body.textContent).toContain('7.50');
    (document.body.querySelector('[data-confirm]') as HTMLButtonElement).click();
    await flushPromises();
    expect(w.emitted('confirm')).toBeUndefined();
    const input = document.body.querySelector('input[name="paymentReference"]') as HTMLInputElement;
    input.value = 'PAY-10';
    input.dispatchEvent(new Event('input'));
    (document.body.querySelector('[data-confirm]') as HTMLButtonElement).click();
    await flushPromises();
    expect(w.emitted('confirm')?.[0]?.[0]).toMatchObject({ paymentReference: 'PAY-10' });
    w.unmount();
  });
});
