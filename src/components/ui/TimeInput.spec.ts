import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TimeInput from './TimeInput.vue';
describe('TimeInput', () => {
  it('normalizes to HH:mm and emits', async () => {
    const w = mount(TimeInput, { props: { modelValue: null } });
    // jsdom sanitizes invalid values on type=time, so exercise the handler via a text input
    const input = w.find('input');
    (input.element as HTMLInputElement).type = 'text';
    await input.setValue('9:5');
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['09:05']);
  });
});
