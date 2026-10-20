export type RoleLevel = 'employee' | 'manager' | 'finance' | 'admin';
export interface RoleRef {
  id: string;
  name: string;
  level: RoleLevel;
}
export interface RoleView extends RoleRef {
  isSystem: boolean;
  systemKey: string | null;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}
export type SheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
export type StepStatus = 'pending' | 'approved' | 'rejected' | 'skipped';

export interface Paged<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number };
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
}

export interface PublicUser extends Person {
  email: string;
  employeeCode: string | null;
  role: RoleRef;
  teamId: string | null;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamSummary {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  techLead: Person | null;
  memberCount: number;
  chainStepCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChainPerson extends Person {
  isActive: boolean;
}

export interface ChainStepView {
  id: string;
  position: number;
  label: string;
  approver: ChainPerson;
  backupApprover: ChainPerson | null;
}

export interface OvertimeType {
  id: string;
  name: string;
  multiplier: number;
  color: string;
  sortOrder: number;
  isActive: boolean;
}

export interface SheetEmployee extends Person {
  employeeCode: string | null;
  teamId: string | null;
  teamName: string | null;
}

export interface SheetSummary {
  id: string;
  period: string;
  status: SheetStatus;
  round: number;
  currentStepPosition: number | null;
  totalHours: number;
  totalWeightedHours: number;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  paidAt: string | null;
  paymentReference: string | null;
  version: number;
  /** Sheet-level team snapshot; may be absent in some responses. */
  teamId?: string | null;
  employee: SheetEmployee;
}

export interface EntryView {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  multiplier: number;
  weightedHours: number;
  overtimeType: { id: string; name: string; color: string };
  workItem: string;
  workItemUrl: string | null;
  description: string;
  requestedBy: Person | null;
  attachment: { id: string; originalName: string; mimeType: string; sizeBytes: number } | null;
}

export interface StepView {
  position: number;
  label: string;
  status: StepStatus;
  round: number;
  approver: Person;
  backupApprover: Person | null;
  decidedBy: Person | null;
  decidedAt: string | null;
  comment: string | null;
  overrideReason: string | null;
}

export interface SheetDetail extends SheetSummary {
  entries: EntryView[];
  steps: StepView[];
}

export interface InboxRow extends SheetSummary {
  step: { position: number; label: string; status: StepStatus; decidedAt: string | null };
}

export interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: unknown;
  reason: string | null;
  createdAt: string;
  actor: Person | null;
}

export interface Timeline {
  sheetId: string;
  audit: AuditRow[];
  rounds: Array<{ round: number; steps: StepView[] }>;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface TeamMonthRow {
  employee: Person & { employeeCode: string | null };
  sheet: SheetSummary | null;
  hoursByType: Record<string, number>;
  totalHours: number;
  totalWeightedHours: number;
  entries: EntryView[];
}

export interface TeamMonthReport {
  team: { id: string; name: string };
  period: string;
  types: Array<{ id: string; name: string; multiplier: number; color: string }>;
  rows: TeamMonthRow[];
  totals: { totalHours: number; totalWeightedHours: number; hoursByType: Record<string, number> };
}

export interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string;
  details?: Array<{ path: string; message: string }>;
}
