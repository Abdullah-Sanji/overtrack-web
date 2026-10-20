import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import Drawer from './Drawer.vue';
function close() {
  (document.body.querySelector('[aria-label="Close"]') as HTMLButtonElement).click();
}
describe('Drawer', () => {
  it('close button emits update:open false once', async () => {
    const w = mount(Drawer, { props: { open: true, title: 'X' }, attachTo: document.body });
    await flushPromises();
    close();
    await flushPromises();
    expect(w.emitted('update:open')).toEqual([[false]]);
    w.unmount();
  });
  it('does not close when beforeClose resolves false', async () => {
    const w = mount(Drawer, {
      props: { open: true, title: 'X', beforeClose: () => Promise.resolve(false) },
      attachTo: document.body,
    });
    await flushPromises();
    close();
    await flushPromises();
    expect(w.emitted('update:open')).toBeUndefined();
    w.unmount();
  });
  it('escape waits for beforeClose', async () => {
    let resolve!: (v: boolean) => void;
    const deferred = new Promise<boolean>((r) => (resolve = r));
    const w = mount(Drawer, {
      props: { open: true, title: 'X', beforeClose: () => deferred },
      attachTo: document.body,
    });
    await flushPromises();
    document.body
      .querySelector('[role="dialog"]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await flushPromises();
    expect(w.emitted('update:open')).toBeUndefined();
    resolve(false);
    await flushPromises();
    expect(w.emitted('update:open')).toBeUndefined();
    w.unmount();

    const w2 = mount(Drawer, {
      props: { open: true, title: 'X', beforeClose: () => Promise.resolve(true) },
      attachTo: document.body,
    });
    await flushPromises();
    document.body
      .querySelector('[role="dialog"]')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await flushPromises();
    expect(w2.emitted('update:open')).toEqual([[false]]);
    w2.unmount();
  });
});
