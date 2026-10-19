import { describe, it, expect } from 'vitest';
import { formatHours, formatPeriod, formatDate, formatDateTime, fullName, initials } from './format';
describe('format', () => {
  it('hours with two decimals', () => { expect(formatHours(2.5)).toBe('2.50'); expect(formatHours(0)).toBe('0.00'); });
  it('period', () => expect(formatPeriod('2026-09')).toBe('September 2026'));
  it('date', () => expect(formatDate('2026-09-10')).toBe('10 Sep 2026'));
  it('date time', () => expect(formatDateTime('2026-09-10T14:05:00.000Z', 'UTC')).toBe('10 Sep 2026, 14:05'));
  it('names', () => { expect(fullName({ firstName: 'Ann', lastName: 'Lee' })).toBe('Ann Lee'); expect(initials({ firstName: 'Ann', lastName: 'Lee' })).toBe('AL'); });
});
