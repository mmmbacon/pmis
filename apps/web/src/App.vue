<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';
import { useThemeStore } from './stores/theme';

const auth = useAuthStore();
const theme = useThemeStore();
const router = useRouter();
const isAccountMenuOpen = ref(false);
const canApprove = computed(() =>
  auth.user?.roles.some((role) => role === 'approver' || role === 'admin'),
);

const logout = async (): Promise<void> => {
  isAccountMenuOpen.value = false;
  await auth.logout();
  await router.push('/login');
};
</script>

<template>
  <div class="min-h-screen">
    <header v-if="auth.isAuthenticated" class="border-b border-slate-800 bg-slate-900/80">
      <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <RouterLink to="/timesheets" class="text-lg font-semibold text-cyan-300"
          >Timesheet Manager</RouterLink
        >
        <div class="flex items-center gap-4 text-sm">
          <RouterLink to="/timesheets" class="text-slate-200 hover:text-cyan-300"
            >Timesheets</RouterLink
          >
          <RouterLink v-if="canApprove" to="/approvals" class="text-slate-200 hover:text-cyan-300"
            >Approvals</RouterLink
          >
          <RouterLink to="/reporting" class="text-slate-200 hover:text-cyan-300"
            >Reporting</RouterLink
          >
          <div class="relative">
            <button
              class="flex items-center gap-2 bg-slate-800 hover:bg-slate-700"
              type="button"
              aria-haspopup="menu"
              :aria-expanded="isAccountMenuOpen"
              @click="isAccountMenuOpen = !isAccountMenuOpen"
            >
              <span>{{ auth.user?.name }}</span>
            </button>
            <div
              v-if="isAccountMenuOpen"
              class="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl"
              role="menu"
            >
              <RouterLink
                to="/settings"
                class="block rounded-lg px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-cyan-300"
                role="menuitem"
                @click="isAccountMenuOpen = false"
              >
                Settings
              </RouterLink>
              <button
                class="w-full text-left hover:bg-slate-800"
                role="menuitem"
                type="button"
                @click="logout"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </nav>
    </header>
    <main class="mx-auto max-w-6xl px-6 py-8">
      <RouterView />
    </main>
  </div>
</template>
