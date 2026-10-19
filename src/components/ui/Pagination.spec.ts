import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Pagination from './Pagination.vue';

describe('Pagination', () => {
  it('shows the range and emits page changes', async () => {
    const w = mount(Pagination, { props: { page: 1, pageSize: 20, total: 57 } });
    expect(w.text()).toContain('1–20 of 57');
    const [prev, next] = w.findAll('button');
    expect(prev.attributes('disabled')).toBeDefined();
    await next.trigger('click');
    expect(w.emitted('update:page')?.[0]).toEqual([2]);
    await w.setProps({ page: 3 });
    expect(w.text()).toContain('41–57 of 57');
    expect(w.findAll('button')[1].attributes('disabled')).toBeDefined();
  });
});
