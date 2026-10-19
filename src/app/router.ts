import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/components/ui/useToast';
import type { Perm } from '@/lib/permissions';
import { resolveNavigation } from './guards';
import AppShell from '@/components/layout/AppShell.vue';

const pub = (name: string, path: string, component: () => Promise<unknown>) => ({
  name,
  path,
  component,
  meta: { public: true },
});

export const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: (_t, _f, saved) => saved ?? { top: 0 },
  routes: [
    pub('login', '/login', () => import('@/features/auth/LoginPage.vue')),
    pub('accept-invite', '/accept-invite', () => import('@/features/auth/AcceptInvitePage.vue')),
    pub('forgot-password', '/forgot-password', () => import('@/features/auth/ForgotPasswordPage.vue')),
    pub('reset-password', '/reset-password', () => import('@/features/auth/ResetPasswordPage.vue')),
    {
      path: '/',
      component: AppShell,
      children: [
        { name: 'dashboard', path: '', component: () => import('@/features/dashboard/DashboardPage.vue') },
        { name: 'my-sheets', path: 'sheets', component: () => import('@/features/sheets/MySheetsPage.vue') },
        {
          name: 'sheet',
          path: 'sheets/:id',
          component: () => import('@/features/sheets/SheetPage.vue'),
          props: true,
        },
        { name: 'inbox', path: 'approvals', component: () => import('@/features/approvals/InboxPage.vue') },
        {
          name: 'review',
          path: 'approvals/:id',
          component: () => import('@/features/approvals/ReviewSheetPage.vue'),
          props: true,
        },
        {
          name: 'team-month',
          path: 'team-month',
          component: () => import('@/features/reports/TeamMonthPage.vue'),
          meta: { perm: 'manager' },
        },
        {
          name: 'payments',
          path: 'payments',
          component: () => import('@/features/payments/PaymentsPage.vue'),
          meta: { perm: 'finance' },
        },
        {
          name: 'admin-users',
          path: 'admin/users',
          component: () => import('@/features/admin/UsersPage.vue'),
          meta: { perm: 'admin' },
        },
        {
          name: 'admin-teams',
          path: 'admin/teams',
          component: () => import('@/features/admin/TeamsPage.vue'),
          meta: { perm: 'admin' },
        },
        {
          name: 'admin-chain',
          path: 'admin/teams/:id/chain',
          component: () => import('@/features/admin/ChainEditorPage.vue'),
          props: true,
          meta: { perm: 'admin' },
        },
        {
          name: 'admin-overtime-types',
          path: 'admin/overtime-types',
          component: () => import('@/features/admin/OvertimeTypesPage.vue'),
          meta: { perm: 'admin' },
        },
        {
          name: 'admin-audit',
          path: 'admin/audit',
          component: () => import('@/features/admin/AuditLogPage.vue'),
          meta: { perm: 'admin' },
        },
        { name: 'profile', path: 'profile', component: () => import('@/features/profile/ProfilePage.vue') },
        {
          name: 'not-found',
          path: ':pathMatch(.*)*',
          component: () => import('@/features/NotFoundPage.vue'),
        },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.bootstrap();
  const r = resolveNavigation(
    { meta: to.meta as { public?: boolean; perm?: Perm }, fullPath: to.fullPath },
    { isAuthenticated: auth.isAuthenticated, user: auth.user },
  );
  if (r === true) return true;
  if ('toast' in r && r.toast) useToast().toast({ title: r.toast, tone: 'error' });
  return r;
});

router.afterEach((to, from) => {
  if (to.path === from.path) return;
  requestAnimationFrame(() => document.getElementById('main')?.focus());
});
