import { describe, it, expect } from 'vitest';
import { periodBounds, previousPeriod, nextPeriod } from './dates';
describe('dates', () => {
  it('bounds', () => expect(periodBounds('2026-02')).toEqual({ min: '2026-02-01', max: '2026-02-28' }));
  it('prev/next', () => {
    expect(previousPeriod('2026-01')).toBe('2025-12');
    expect(nextPeriod('2026-12')).toBe('2027-01');
  });
});
