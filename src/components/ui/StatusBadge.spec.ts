import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import StatusBadge from './StatusBadge.vue';
describe('StatusBadge', () => {
  it.each([
    ['draft', 'Draft'],
    ['submitted', 'Submitted'],
    ['approved', 'Approved'],
    ['paid', 'Paid'],
    ['rejected', 'Rejected'],
  ] as const)('%s → %s with an icon', (status, label) => {
    const w = mount(StatusBadge, { props: { status } });
    expect(w.text()).toBe(label);
    expect(w.find('svg').exists()).toBe(true);
  });
  it.each([
    ['draft', 'bg-muted'],
    ['submitted', 'bg-primary-soft'],
    ['approved', 'bg-accent-soft'],
    ['paid', 'bg-paid-soft'],
    ['rejected', 'bg-destructive-soft'],
  ] as const)('%s uses the %s tone', (status, cls) =>
    expect(mount(StatusBadge, { props: { status } }).classes()).toContain(cls),
  );
});
