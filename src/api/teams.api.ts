import { get, post, patch, del } from './client';
import type { Paged, PublicUser, TeamSummary } from './types';
export const teamsApi = {
  list: (q: { search?: string; isActive?: 'true' | 'false'; page?: number; pageSize?: number } = {}) =>
    get<Paged<TeamSummary>>('/teams', q),
  get: (id: string) => get<{ data: TeamSummary }>(`/teams/${id}`).then((r) => r.data),
  members: (id: string) => get<{ data: PublicUser[] }>(`/teams/${id}/members`).then((r) => r.data),
  create: (b: { name: string; description?: string | null; techLeadId?: string | null }) =>
    post<{ data: TeamSummary }>('/teams', b).then((r) => r.data),
  update: (
    id: string,
    b: Partial<{ name: string; description: string | null; techLeadId: string | null; isActive: boolean }>,
  ) => patch<{ data: TeamSummary }>(`/teams/${id}`, b).then((r) => r.data),
  remove: (id: string) => del<void>(`/teams/${id}`),
};
