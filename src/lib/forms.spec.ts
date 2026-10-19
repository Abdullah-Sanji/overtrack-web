import { describe, it, expect } from 'vitest';
import { focusFirstInvalid } from './forms';

describe('focusFirstInvalid', () => {
  it('focuses the first aria-invalid field', async () => {
    document.body.innerHTML =
      '<input id="a"><input id="b" aria-invalid="true"><input id="c" aria-invalid="true">';
    await focusFirstInvalid();
    expect(document.activeElement?.id).toBe('b');
  });
});
