import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import type { ColumnDef } from '@tanstack/vue-table';
import type { Component } from 'vue';
import DataTableSfc from './DataTable.vue';

// Generic SFCs infer T as unknown under mount(); cast once so Row-typed props type-check.
const DataTable = DataTableSfc as unknown as Component;

type Row = { id: string; name: string; hours: number };
const columns: ColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'hours', header: 'Hours', meta: { numeric: true } },
];
const rows: Row[] = [
  { id: '1', name: 'Bob', hours: 2 },
  { id: '2', name: 'Ann', hours: 5 },
];

describe('DataTable', () => {
  it('renders rows and sorts on header click', async () => {
    const w = mount(DataTable, { props: { columns, rows, rowKey: (r: Row) => r.id, sortable: true } });
    expect(w.findAll('tbody tr').map((r) => r.text())).toEqual(['Bob2', 'Ann5']);
    await w.find('thead th button').trigger('click');
    expect(w.findAll('tbody tr')[0].text()).toContain('Ann');
    expect(w.find('thead th').attributes('aria-sort')).toBe('ascending');
  });

  it('shows skeleton, empty and error states', async () => {
    const w = mount(DataTable, { props: { columns, rows: [], rowKey: (r: Row) => r.id, loading: true } });
    expect(w.findAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
    await w.setProps({ loading: false });
    expect(w.text()).toContain('Nothing here');
    await w.setProps({ error: 'Boom' });
    expect(w.text()).toContain('Boom');
    await w.find('button').trigger('click');
    expect(w.emitted('retry')).toHaveLength(1);
  });

  it('marks rows clickable only when a rowClick listener is present', async () => {
    const plain = mount(DataTable, { props: { columns, rows, rowKey: (r: Row) => r.id } });
    expect(plain.find('tbody tr').classes()).not.toContain('cursor-pointer');
    const clickable = mount(DataTable, {
      props: { columns, rows, rowKey: (r: Row) => r.id, onRowClick: () => {} },
    });
    expect(clickable.find('tbody tr').classes()).toContain('cursor-pointer');
  });

  it('activates a clickable row from the keyboard', async () => {
    const w = mount(DataTable, {
      props: { columns, rows, rowKey: (r: Row) => r.id, onRowClick: () => {} },
    });
    const row = w.find('tbody tr');
    expect(row.attributes('tabindex')).toBe('0');
    await row.trigger('keydown.enter');
    await row.trigger('keydown.space');
    expect(w.emitted('rowClick')).toHaveLength(2);
  });

  it('renders the footer slot inside the table', () => {
    const w = mount(DataTable, {
      props: { columns, rows, rowKey: (r: Row) => r.id },
      slots: { footer: '<td>Totals</td>' },
    });
    expect(w.find('table tfoot tr td').text()).toBe('Totals');
  });

  it('applies numeric class and toggles expansion without emitting rowClick', async () => {
    const w = mount(DataTable, {
      props: { columns, rows, rowKey: (r: Row) => r.id, expandable: true },
      slots: { expanded: '<p class="detail">more</p>' },
    });
    expect(w.find('tbody tr td:nth-child(3)').classes()).toEqual(
      expect.arrayContaining(['num', 'text-right']),
    );
    const toggle = w.find('tbody tr button[aria-expanded]');
    expect(toggle.attributes('aria-expanded')).toBe('false');
    await toggle.trigger('click');
    expect(toggle.attributes('aria-expanded')).toBe('true');
    expect(w.find('.detail').exists()).toBe(true);
    expect(w.emitted('rowClick')).toBeUndefined();
  });
});
