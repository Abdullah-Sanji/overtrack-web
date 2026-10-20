import { describe, it, expect } from 'vitest';
import { hasPerm } from './permissions';
import { makeUser } from '@/test/fixtures';
import type { RoleLevel } from '@/api/types';

const u = (level: RoleLevel) => makeUser({ level });

describe('permissions', () => {
  it('admin', () => {
    expect(hasPerm(u('admin'), 'admin')).toBe(true);
    expect(hasPerm(u('finance'), 'admin')).toBe(false);
  });
  it('finance includes admin', () => {
    expect(hasPerm(u('admin'), 'finance')).toBe(true);
    expect(hasPerm(u('employee'), 'finance')).toBe(false);
  });
  it('manager levels', () => {
    expect(hasPerm(u('manager'), 'manager')).toBe(true);
    expect(hasPerm(u('employee'), 'manager')).toBe(false);
    expect(hasPerm(u('finance'), 'approver')).toBe(true);
    expect(hasPerm(null, 'manager')).toBe(false);
  });
});
