import { describe, it, expect } from 'vitest';
import { entrySchema, deriveHours } from './entry.schema';

const base = {
  date: '2026-09-10',
  startTime: '18:00',
  endTime: '20:30',
  overtimeTypeId: '11111111-1111-4111-8111-111111111111',
  workItem: 'PROJ-1',
  workItemUrl: '',
  description: 'Hotfix for payments',
  requestedById: null,
};
const s = entrySchema('2026-09', '2026-09-20');

describe('entrySchema', () => {
  it('accepts a valid entry and derives hours', () => {
    expect(s.safeParse(base).success).toBe(true);
    expect(deriveHours('18:00', '20:30')).toBe(2.5);
  });
  it('rejects empty date, out-of-period and future dates', () => {
    expect(s.safeParse({ ...base, date: '' }).success).toBe(false);
    expect(s.safeParse({ ...base, date: '2026-10-01' }).error?.issues[0].path).toEqual(['date']);
    expect(s.safeParse({ ...base, date: '2026-09-25' }).error?.issues[0].message).toMatch(/future/);
  });
  it('rejects end before start and bad quarter steps', () => {
    expect(s.safeParse({ ...base, endTime: '17:00' }).error?.issues[0].path).toEqual(['endTime']);
    expect(s.safeParse({ ...base, hours: 1.3 }).success).toBe(false);
  });
  it('treats empty url as null', () => {
    expect(s.parse(base).workItemUrl).toBeNull();
  });
});
