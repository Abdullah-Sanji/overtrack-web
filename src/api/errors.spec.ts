import { describe, it, expect } from 'vitest';
import { ApiError, messageFor, fieldErrors } from './errors';

describe('errors', () => {
  it('maps known codes', () => {
    expect(messageFor(new ApiError(409, 'SHEET_VERSION_CONFLICT', 'x'))).toBe(
      'This sheet changed since you loaded it. Reload and try again.',
    );
    expect(messageFor(new ApiError(403, 'NOT_CURRENT_APPROVER', 'x'))).toBe(
      'You are not the approver for this step.',
    );
    expect(messageFor(new Error('zzz'))).toBe('Something went wrong. Please try again.');
  });

  it('extracts field errors', () => {
    const e = new ApiError(400, 'VALIDATION_FAILED', 'Validation failed', [
      { path: 'email', message: 'Invalid email' },
    ]);
    expect(fieldErrors(e)).toEqual({ email: 'Invalid email' });
  });
});
