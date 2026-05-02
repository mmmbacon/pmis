import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { authApi, registerTokenProvider } from '../api/client';
import type { AuthResponse, User } from '../types/api';

const accessKey = 'timesheet.accessToken';
const refreshKey = 'timesheet.refreshToken';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const accessToken = ref(localStorage.getItem(accessKey));
  const refreshToken = ref(localStorage.getItem(refreshKey));
  const error = ref<string | null>(null);
  const isAuthenticated = computed(() => Boolean(accessToken.value && user.value));

  const setTokens = (response: AuthResponse): void => {
    user.value = response.user;
    accessToken.value = response.accessToken;
    refreshToken.value = response.refreshToken;
    localStorage.setItem(accessKey, response.accessToken);
    localStorage.setItem(refreshKey, response.refreshToken);
  };

  const clear = (): void => {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    localStorage.removeItem(accessKey);
    localStorage.removeItem(refreshKey);
  };

  registerTokenProvider({
    get accessToken() {
      return accessToken.value;
    },
    get refreshToken() {
      return refreshToken.value;
    },
    setTokens,
    clear,
  });

  const login = async (email: string, password: string): Promise<void> => {
    error.value = null;
    try {
      setTokens(await authApi.login(email, password));
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Login failed';
      throw caught;
    }
  };

  const loadMe = async (): Promise<void> => {
    if (!accessToken.value) {
      return;
    }
    user.value = await authApi.me();
  };

  const logout = async (): Promise<void> => {
    try {
      if (accessToken.value) {
        await authApi.logout();
      }
    } finally {
      clear();
    }
  };

  return {
    user,
    accessToken,
    refreshToken,
    error,
    isAuthenticated,
    login,
    loadMe,
    logout,
    setTokens,
    clear,
  };
});
