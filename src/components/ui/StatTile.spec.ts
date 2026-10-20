import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StatTile from './StatTile.vue';
describe('StatTile', () => {
  it.each([
    ['info', 'bg-primary-soft'],
    ['success', 'bg-accent-soft'],
    ['warning', 'bg-warning-soft'],
  ] as const)('%s tone tints only the icon wrapper', (tone, cls) => {
    const w = mount(StatTile, {
      props: { label: 'L', value: 5, tone },
      slots: { icon: '<i data-test="ic" />' },
    });
    expect(w.find('[data-test="ic"]').element.parentElement?.classList.contains(cls)).toBe(true);
    const value = w.find('.num');
    expect(value.classes()).toContain('text-foreground');
    expect(value.classes().join(' ')).not.toMatch(/text-(accent|warning|secondary)/);
  });
});
