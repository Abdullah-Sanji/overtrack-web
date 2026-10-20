export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Array<{ path: string; message: string }>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const MESSAGES: Record<string, string> = {
  ROLE_NAME_TAKEN: 'A role with that name already exists.',
  ROLE_IS_SYSTEM: 'Built-in roles cannot be deleted or re-levelled.',
  ROLE_IN_USE: 'Users still have this role. Move them to another role first.',
  CANNOT_DEMOTE_SELF: 'You cannot remove admin level from your own role.',
  USER_HAS_HISTORY: 'This user has history (sheets, approvals or audit entries). Deactivate them instead.',
  CANNOT_DELETE_SELF: 'You cannot delete your own account.',
  TEAM_IN_USE: 'This team still has members or sheets. Move the members first, or deactivate the team.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  USER_INACTIVE: 'This account is inactive. Contact an admin.',
  TOKEN_EXPIRED: 'Your session expired. Please sign in again.',
  TOKEN_INVALID: 'This link is invalid or was already used.',
  TOKEN_REUSED: 'Your session was revoked. Please sign in again.',
  FORBIDDEN: 'You do not have permission to do that.',
  NOT_FOUND: 'Not found.',
  SHEET_NOT_EDITABLE: 'This sheet is locked and cannot be edited.',
  SHEET_VERSION_CONFLICT: 'This sheet changed since you loaded it. Reload and try again.',
  SHEET_EMPTY: 'Add at least one entry before submitting.',
  CHAIN_EMPTY: 'Your team has no approval chain yet. Ask an admin to configure it.',
  CHAIN_APPROVER_INACTIVE: 'An approver on your team chain is inactive. Ask an admin to fix the chain.',
  NOT_CURRENT_APPROVER: 'You are not the approver for this step.',
  INVALID_TRANSITION: 'That action is not allowed in the sheet’s current state.',
  ENTRY_OVERLAP: 'This entry overlaps another entry on the same day.',
  ENTRY_OUT_OF_PERIOD: 'The date must be inside the sheet’s month.',
  ENTRY_IN_FUTURE: 'The date cannot be in the future.',
  ATTACHMENT_TOO_LARGE: 'The file is larger than 5 MB.',
  ATTACHMENT_TYPE: 'Only PNG, JPEG and PDF files are allowed.',
  ATTACHMENT_EXISTS: 'This entry already has an attachment.',
  REASON_REQUIRED: 'A reason is required.',
  PAYMENT_REFERENCE_REQUIRED: 'A payment reference is required.',
  EMAIL_TAKEN: 'That email is already in use.',
  EMPLOYEE_CODE_TAKEN: 'That employee code is already in use.',
  TEAM_NAME_TAKEN: 'That team name is already in use.',
  USER_HAS_NO_TEAM: 'You are not assigned to a team yet. Ask an admin.',
  RATE_LIMITED: 'Too many attempts. Wait a minute and try again.',
};

const FALLBACK = 'Something went wrong. Please try again.';

export function messageFor(err: unknown): string {
  if (err instanceof ApiError) {
    return (
      MESSAGES[err.code] ??
      (err.code === 'VALIDATION_FAILED' ? 'Please fix the highlighted fields.' : err.message || FALLBACK)
    );
  }
  return FALLBACK;
}

export function fieldErrors(err: unknown): Record<string, string> {
  if (err instanceof ApiError && err.code === 'VALIDATION_FAILED' && err.details) {
    return Object.fromEntries(err.details.map((d) => [d.path, d.message]));
  }
  return {};
}
