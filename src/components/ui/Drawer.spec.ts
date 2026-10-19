import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import Drawer from './Drawer.vue';
describe('Drawer', () => {
  it('close button emits beforeClose once and update:open false once', async () => {
    const w = mount(Drawer, { props: { open: true, title: 'X' }, attachTo: document.body });
    await flushPromises();
    (document.body.querySelector('[aria-label="Close"]') as HTMLButtonElement).click();
    await flushPromises();
    expect(w.emitted('beforeClose')).toHaveLength(1);
    expect(w.emitted('update:open')).toEqual([[false]]);
    w.unmount();
  });
  it('does not close when beforeClose is prevented', async () => {
    const w = mount(Drawer, {
      props: { open: true, title: 'X', onBeforeClose: (e: Event) => e.preventDefault() },
      attachTo: document.body,
    });
    await flushPromises();
    (document.body.querySelector('[aria-label="Close"]') as HTMLButtonElement).click();
    await flushPromises();
    expect(w.emitted('update:open')).toBeUndefined();
    expect(w.emitted('beforeClose')).toHaveLength(1);
    w.unmount();
  });
});
