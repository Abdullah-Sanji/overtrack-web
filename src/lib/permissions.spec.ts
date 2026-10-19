import { describe, it, expect } from 'vitest';
import { hasPerm } from './permissions';

const u = (role: string) => ({ role }) as never;

describe('permissions', () => {
  it('admin', () => {
    expect(hasPerm(u('admin'), 'admin')).toBe(true);
    expect(hasPerm(u('finance'), 'admin')).toBe(false);
  });
  it('finance includes admin', () => {
    expect(hasPerm(u('admin'), 'finance')).toBe(true);
    expect(hasPerm(u('employee'), 'finance')).toBe(false);
  });
  it('manager roles', () => {
    expect(hasPerm(u('tech_lead'), 'manager')).toBe(true);
    expect(hasPerm(u('employee'), 'manager')).toBe(false);
  });
});
