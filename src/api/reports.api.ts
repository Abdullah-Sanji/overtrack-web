import { get, request } from './client';
import type { TeamMonthReport } from './types';
import { downloadResponse } from '@/lib/download';
type Params = { teamId?: string; period: string; status?: string };
export const reportsApi = {
  teamMonth: (p: Params & { teamId: string }) =>
    get<{ data: TeamMonthReport }>('/reports/team-month', p).then((r) => r.data),
  exportTeamMonth: async (p: Params & { teamId: string }, format: 'xlsx' | 'csv') =>
    downloadResponse(
      await request<Response>('GET', '/reports/team-month/export', { query: { ...p, format }, raw: true }),
      `overtrack-${p.period}.${format}`,
    ),
  exportEmployees: async (p: Params, format: 'xlsx' | 'csv') =>
    downloadResponse(
      await request<Response>('GET', '/reports/employees/export', { query: { ...p, format }, raw: true }),
      `overtrack-all-${p.period}.${format}`,
    ),
};
