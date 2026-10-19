import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import Dialog from './Dialog.vue';
describe('Dialog', () => {
  it('renders title and content when open', async () => {
    const w = mount(Dialog, {
      props: { open: true, title: 'Submit sheet' },
      slots: { default: '<p>Body</p>' },
      attachTo: document.body,
    });
    await flushPromises();
    expect(document.body.textContent).toContain('Submit sheet');
    expect(document.body.textContent).toContain('Body');
    w.unmount();
  });
  it('emits update:open false on close button', async () => {
    const w = mount(Dialog, { props: { open: true, title: 'X' }, attachTo: document.body });
    await flushPromises();
    (document.body.querySelector('[data-dialog-close]') as HTMLButtonElement).click();
    expect(w.emitted('update:open')?.[0]).toEqual([false]);
    w.unmount();
  });
});
