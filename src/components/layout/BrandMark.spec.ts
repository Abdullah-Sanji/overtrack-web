import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BrandMark from './BrandMark.vue';
describe('BrandMark', () => {
  it('renders a decorative image and the wordmark', () => {
    const w = mount(BrandMark);
    expect(w.find('img').attributes('alt')).toBe('');
    expect(w.text()).toBe('OverTrack');
  });
  it('hides the wordmark when wordmark is false', () => {
    const w = mount(BrandMark, { props: { wordmark: false } });
    expect(w.text()).toBe('');
    expect(w.find('img').exists()).toBe(true);
  });
});
