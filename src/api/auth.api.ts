import { post, get, request } from './client';
import type { PublicUser } from './types';

export const authApi = {
  login: (email: string, password: string) =>
    request<{ data: { accessToken: string; user: PublicUser } }>('POST', '/auth/login', {
      body: { email, password },
      skipAuth: true,
    }).then((r) => r.data),
  refresh: () =>
    request<{ data: { accessToken: string } }>('POST', '/auth/refresh', { skipAuth: true }).then(
      (r) => r.data.accessToken,
    ),
  logout: () => request<void>('POST', '/auth/logout', { skipAuth: true }),
  acceptInvite: (token: string, password: string) =>
    request<void>('POST', '/auth/accept-invite', { body: { token, password }, skipAuth: true }),
  forgotPassword: (email: string) =>
    request<void>('POST', '/auth/forgot-password', { body: { email }, skipAuth: true }),
  resetPassword: (token: string, password: string) =>
    request<void>('POST', '/auth/reset-password', { body: { token, password }, skipAuth: true }),
  me: () => get<{ data: PublicUser }>('/me').then((r) => r.data),
  updateMe: (b: { firstName?: string; lastName?: string; timezone?: string }) =>
    request<{ data: PublicUser }>('PATCH', '/me', { body: b }).then((r) => r.data),
  changePassword: (currentPassword: string, newPassword: string) =>
    post<void>('/me/change-password', { currentPassword, newPassword }),
};
