<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const email = ref('employee@example.com');
const password = ref('password123');
const submitting = ref(false);

const submit = async (): Promise<void> => {
  submitting.value = true;
  try {
    await auth.login(email.value, password.value);
    await router.push('/timesheets');
  } finally {
    submitting.value = false;
  }
};

const useDemo = (kind: 'employee' | 'approver'): void => {
  email.value = kind === 'employee' ? 'employee@example.com' : 'approver@example.com';
  password.value = 'password123';
};
</script>

<template>
  <section class="mx-auto max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
    <h1 class="text-3xl font-bold text-cyan-300">Timesheet Manager</h1>
    <p class="mt-2 text-slate-400">Sign in with a seeded local demo account.</p>

    <form class="mt-8 space-y-4" data-cy="login-form" @submit.prevent="submit">
      <label class="block">
        <span class="text-sm text-slate-300">Email</span>
        <input v-model="email" class="mt-1 w-full" data-cy="email-input" type="email" />
      </label>
      <label class="block">
        <span class="text-sm text-slate-300">Password</span>
        <input v-model="password" class="mt-1 w-full" data-cy="password-input" type="password" />
      </label>
      <p v-if="auth.error" class="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">
        {{ auth.error }}
      </p>
      <button
        class="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400"
        data-cy="login-submit"
        :disabled="submitting"
      >
        {{ submitting ? 'Signing in...' : 'Sign in' }}
      </button>
    </form>

    <div class="mt-5 grid grid-cols-2 gap-3">
      <button class="bg-slate-800 hover:bg-slate-700" type="button" @click="useDemo('employee')">
        Employee demo
      </button>
      <button class="bg-slate-800 hover:bg-slate-700" type="button" @click="useDemo('approver')">
        Approver demo
      </button>
    </div>
  </section>
</template>
