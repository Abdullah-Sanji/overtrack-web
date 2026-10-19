import { get } from './client';
import type { Paged, AuditRow } from './types';
export const auditApi = {
  list: (
    q: {
      entityType?: string;
      entityId?: string;
      actorId?: string;
      from?: string;
      to?: string;
      page?: number;
    } = {},
  ) => get<Paged<AuditRow>>('/admin/audit', q),
};
