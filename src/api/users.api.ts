import { get, post, patch } from './client';
import type { Paged, PublicUser, UserRole } from './types';
export interface UserInput {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  teamId?: string | null;
  employeeCode?: string | null;
  timezone?: string;
}
export interface DirectoryUser {
  id: string;
  firstName: string;
  lastName: string;
  teamId: string | null;
  role: UserRole;
}
export const usersApi = {
  list: (
    q: {
      search?: string;
      role?: string;
      teamId?: string;
      isActive?: 'true' | 'false';
      page?: number;
      pageSize?: number;
    } = {},
  ) => get<Paged<PublicUser>>('/users', q),
  directory: (search?: string) =>
    get<{ data: DirectoryUser[] }>('/users/directory', { search }).then((r) => r.data),
  get: (id: string) => get<{ data: PublicUser }>(`/users/${id}`).then((r) => r.data),
  create: (b: UserInput) => post<{ data: PublicUser }>('/users', b).then((r) => r.data),
  update: (id: string, b: Partial<Omit<UserInput, 'email'>>) =>
    patch<{ data: PublicUser }>(`/users/${id}`, b).then((r) => r.data),
  deactivate: (id: string) => post<{ data: PublicUser }>(`/users/${id}/deactivate`).then((r) => r.data),
  reactivate: (id: string) => post<{ data: PublicUser }>(`/users/${id}/reactivate`).then((r) => r.data),
  resendInvite: (id: string) => post<void>(`/users/${id}/resend-invite`),
};
