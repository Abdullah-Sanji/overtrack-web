import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import OvertimeTypesPage from './OvertimeTypesPage.vue';
const update = vi.fn(async (id: string, b: unknown) => ({ id, ...(b as object) }));
vi.mock('@/api/overtime-types.api', () => ({
  overtimeTypesApi: {
    list: vi.fn(async () => [
      { id: 't1', name: 'Weekend', multiplier: 2, color: '#000000', sortOrder: 1, isActive: true },
    ]),
    update: (...a: unknown[]) => update(...(a as [string, unknown])),
    create: vi.fn(),
  },
}));
describe('OvertimeTypesPage', () => {
  it('enables Save when a multiplier changes and sends the patch', async () => {
    const w = mount(OvertimeTypesPage, {
      global: { plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]] },
    });
    await flushPromises();
    const save = w.find('[data-action="save-t1"]');
    expect(save.attributes('disabled')).toBeDefined();
    await w.find('input[name="multiplier-t1"]').setValue('2.25');
    expect(w.find('[data-action="save-t1"]').attributes('disabled')).toBeUndefined();
    expect(w.text()).toContain('Applies to future submissions only');
    await w.find('[data-action="save-t1"]').trigger('click');
    await flushPromises();
    expect(update).toHaveBeenCalledWith('t1', expect.objectContaining({ multiplier: 2.25 }));
  });
});
