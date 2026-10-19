import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import TeamMonthTable from './TeamMonthTable.vue';
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
const report = {
  team: { id: 't', name: 'Platform' },
  period: '2026-09',
  types: [
    { id: 'wd', name: 'Weekday', multiplier: 1.5, color: '#000' },
    { id: 'we', name: 'Weekend', multiplier: 2, color: '#000' },
  ],
  rows: [
    {
      employee: { id: 'a', firstName: 'Ann', lastName: 'Lee', employeeCode: 'E1' },
      sheet: { id: 's', status: 'approved', paidAt: null } as never,
      hoursByType: { wd: 2, we: 4 },
      totalHours: 6,
      totalWeightedHours: 11,
      entries: [],
    },
    {
      employee: { id: 'b', firstName: 'Bob', lastName: 'Ray', employeeCode: null },
      sheet: null,
      hoursByType: {},
      totalHours: 0,
      totalWeightedHours: 0,
      entries: [],
    },
  ],
  totals: { totalHours: 6, totalWeightedHours: 11, hoursByType: { wd: 2, we: 4 } },
};
describe('TeamMonthTable', () => {
  it('renders per-type columns, rows and a totals footer', () => {
    const w = mount(TeamMonthTable, { props: { report: report as never } });
    const headers = w.findAll('thead th').map((t) => t.text());
    expect(headers).toEqual(expect.arrayContaining(['Weekday (h)', 'Weekend (h)', 'Total', 'Weighted']));
    expect(w.text()).toContain('Ann Lee');
    expect(w.text()).toContain('No sheet');
    expect(w.find('tfoot').text()).toContain('11.00');
  });
});
