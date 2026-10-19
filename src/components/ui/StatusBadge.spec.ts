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
  it('paid uses the accent tone', () =>
    expect(
      mount(StatusBadge, { props: { status: 'paid' } })
        .classes()
        .join(' '),
    ).toContain('accent'));
});
