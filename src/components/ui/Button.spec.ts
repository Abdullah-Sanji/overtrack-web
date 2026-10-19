import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Button from './Button.vue';
describe('Button', () => {
  it('renders slot and primary classes', () => {
    const w = mount(Button, { slots: { default: 'Save' } });
    expect(w.text()).toBe('Save');
    expect(w.classes()).toContain('bg-primary');
    expect(w.attributes('type')).toBe('button');
  });
  it('disables and shows spinner when loading', () => {
    const w = mount(Button, { props: { loading: true }, slots: { default: 'Save' } });
    expect(w.attributes('disabled')).toBeDefined();
    expect(w.find('[data-spinner]').exists()).toBe(true);
    expect(w.attributes('aria-busy')).toBe('true');
  });
  it('destructive variant', () =>
    expect(mount(Button, { props: { variant: 'destructive' } }).classes()).toContain('bg-destructive'));
});
