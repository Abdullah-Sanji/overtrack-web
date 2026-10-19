import { get, post, patch } from './client';
import type { OvertimeType } from './types';
export const overtimeTypesApi = {
  list: (includeInactive = false) =>
    get<{ data: OvertimeType[] }>('/overtime-types', {
      includeInactive: includeInactive ? 'true' : undefined,
    }).then((r) => r.data),
  create: (b: { name: string; multiplier: number; color?: string; sortOrder?: number }) =>
    post<{ data: OvertimeType }>('/overtime-types', b).then((r) => r.data),
  update: (
    id: string,
    b: Partial<{ name: string; multiplier: number; color: string; sortOrder: number; isActive: boolean }>,
  ) => patch<{ data: OvertimeType }>(`/overtime-types/${id}`, b).then((r) => r.data),
};
