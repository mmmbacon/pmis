import { createRouter, createWebHistory } from 'vue-router';
import ApprovalsPage from '../pages/ApprovalsPage.vue';
import LoginPage from '../pages/LoginPage.vue';
import ReportingPage from '../pages/ReportingPage.vue';
import SettingsPage from '../pages/SettingsPage.vue';
import TimesheetsPage from '../pages/TimesheetsPage.vue';
import { useAuthStore } from '../stores/auth';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/timesheets' },
    { path: '/login', component: LoginPage },
    { path: '/timesheets', component: TimesheetsPage, meta: { requiresAuth: true } },
    { path: '/approvals', component: ApprovalsPage, meta: { requiresAuth: true } },
    { path: '/reporting', component: ReportingPage, meta: { requiresAuth: true } },
    { path: '/settings', component: SettingsPage, meta: { requiresAuth: true } },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (auth.accessToken && !auth.user) {
    await auth.loadMe().catch(() => auth.clear());
  }
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login';
  }
  if (to.path === '/login' && auth.isAuthenticated) {
    return '/timesheets';
  }
  return true;
});
