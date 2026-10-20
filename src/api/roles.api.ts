import { get, post, patch, del } from './client';
import type { RoleLevel, RoleView } from './types';
export const rolesApi = {
  list: () => get<{ data: RoleView[] }>('/roles').then((r) => r.data),
  create: (b: { name: string; level: RoleLevel }) =>
    post<{ data: RoleView }>('/roles', b).then((r) => r.data),
  update: (id: string, b: Partial<{ name: string; level: RoleLevel }>) =>
    patch<{ data: RoleView }>(`/roles/${id}`, b).then((r) => r.data),
  remove: (id: string) => del<void>(`/roles/${id}`),
};
