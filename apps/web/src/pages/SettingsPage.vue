<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { agentsApi } from '../api/client';
import { useAuthStore } from '../stores/auth';
import { useThemeStore, type ThemeId } from '../stores/theme';
import type { Agent, AgentApiKeySummary } from '../types/api';

const auth = useAuthStore();
const theme = useThemeStore();
const agents = ref<Agent[]>([]);
const agentsLoaded = ref(false);
const loadingAgents = ref(false);
const agentError = ref<string | null>(null);
const createForm = reactive({ name: '', description: '' });
const keyNames = reactive<Record<string, string>>({});
const issuedKeys = reactive<Record<string, string>>({});

const isAdmin = computed(() => auth.user?.roles.includes('admin') ?? false);

const selectTheme = (themeId: ThemeId): void => {
  theme.setTheme(themeId);
};

const loadAgents = async (): Promise<void> => {
  loadingAgents.value = true;
  agentError.value = null;
  try {
    agents.value = await agentsApi.list();
    agentsLoaded.value = true;
  } catch (caught) {
    agentError.value = caught instanceof Error ? caught.message : 'Unable to load agents';
  } finally {
    loadingAgents.value = false;
  }
};

watch(
  isAdmin,
  (admin) => {
    if (admin && !agentsLoaded.value && !loadingAgents.value) {
      void loadAgents();
    }
  },
  { immediate: true },
);

const createAgent = async (): Promise<void> => {
  const name = createForm.name.trim();
  if (!name) {
    return;
  }
  agentError.value = null;
  try {
    const agent = await agentsApi.create({
      name,
      description: createForm.description.trim() || undefined,
    });
    agents.value = [agent, ...agents.value];
    createForm.name = '';
    createForm.description = '';
  } catch (caught) {
    agentError.value = caught instanceof Error ? caught.message : 'Unable to create agent';
  }
};

const issueKey = async (agent: Agent): Promise<void> => {
  const name = keyNames[agent.id]?.trim();
  if (!name) {
    return;
  }
  agentError.value = null;
  try {
    const response = await agentsApi.createApiKey(agent.id, name);
    issuedKeys[response.key.id] = response.rawKey;
    keyNames[agent.id] = '';
    await loadAgents();
  } catch (caught) {
    agentError.value = caught instanceof Error ? caught.message : 'Unable to issue API key';
  }
};

const revokeKey = async (agent: Agent, key: AgentApiKeySummary): Promise<void> => {
  agentError.value = null;
  try {
    await agentsApi.revokeApiKey(agent.id, key.id);
    await loadAgents();
  } catch (caught) {
    agentError.value = caught instanceof Error ? caught.message : 'Unable to revoke API key';
  }
};

const setAgentDisabled = async (agent: Agent, disabled: boolean): Promise<void> => {
  agentError.value = null;
  try {
    const updated = await agentsApi.update(agent.id, { disabled });
    agents.value = agents.value.map((item) => (item.id === updated.id ? updated : item));
  } catch (caught) {
    agentError.value = caught instanceof Error ? caught.message : 'Unable to update agent';
  }
};

const copyIssuedKey = async (key?: string): Promise<void> => {
  if (key) {
    await navigator.clipboard?.writeText(key);
  }
};

const activeKeyCount = (agent: Agent): number =>
  agent.apiKeys.filter((key) => !key.revokedAt).length;

const formatDate = (value: string | null): string => {
  if (!value) {
    return 'Never';
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
};
</script>

<template>
  <section class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold">Settings</h1>
      <p class="text-slate-400">Manage your local preferences and administrative settings.</p>
    </div>

    <div class="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h2 class="text-xl font-semibold">Personal settings</h2>
      <p class="mt-1 text-sm text-slate-400">Your selection is saved locally on this device.</p>

      <div class="mt-5 grid gap-4 md:grid-cols-2">
        <button
          v-for="option in theme.themeOptions"
          :key="option.id"
          class="season-card border text-left hover:border-cyan-300"
          :class="{ 'season-card-active': theme.selectedTheme === option.id }"
          :data-theme-preview="option.id"
          type="button"
          @click="selectTheme(option.id)"
        >
          <span class="flex items-center justify-between gap-3">
            <span>
              <span class="block text-lg font-semibold">{{ option.name }}</span>
              <span class="mt-1 block text-sm opacity-80">{{ option.description }}</span>
            </span>
            <span
              v-if="theme.selectedTheme === option.id"
              class="rounded-full px-3 py-1 text-xs font-semibold"
              >Selected</span
            >
          </span>
          <span class="mt-4 grid grid-cols-4 gap-2">
            <span class="season-swatch season-swatch-background"></span>
            <span class="season-swatch season-swatch-surface"></span>
            <span class="season-swatch season-swatch-accent"></span>
            <span class="season-swatch season-swatch-muted"></span>
          </span>
        </button>
      </div>
    </div>

    <div v-if="isAdmin" class="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 class="text-xl font-semibold">Agent management</h2>
          <p class="mt-1 text-sm text-slate-400">
            Create agent identities, issue one-time API keys, and revoke or disable access.
          </p>
        </div>
        <button
          class="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold hover:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          :disabled="loadingAgents"
          @click="loadAgents"
        >
          Refresh
        </button>
      </div>

      <p
        v-if="agentError"
        class="mt-4 rounded-xl border border-red-900 bg-red-950/60 p-3 text-sm text-red-100"
      >
        {{ agentError }}
      </p>

      <form
        class="mt-5 grid gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4 md:grid-cols-[1fr_2fr_auto]"
        @submit.prevent="createAgent"
      >
        <label class="text-sm">
          <span class="mb-1 block font-semibold">Agent name</span>
          <input
            v-model="createForm.name"
            class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            maxlength="120"
            placeholder="pmis-coding-agent"
            type="text"
          />
        </label>
        <label class="text-sm">
          <span class="mb-1 block font-semibold">Description</span>
          <input
            v-model="createForm.description"
            class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="What this agent will submit time for"
            type="text"
          />
        </label>
        <button
          class="self-end rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          :disabled="!createForm.name.trim()"
        >
          Create agent
        </button>
      </form>

      <div v-if="loadingAgents && !agentsLoaded" class="mt-5 text-sm text-slate-400">
        Loading agents...
      </div>
      <div
        v-else-if="agents.length === 0"
        class="mt-5 rounded-xl border border-dashed border-slate-700 p-5 text-sm text-slate-400"
      >
        No agents have been created yet.
      </div>
      <div v-else class="mt-5 space-y-4">
        <article
          v-for="agent in agents"
          :key="agent.id"
          class="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
        >
          <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-lg font-semibold">{{ agent.name }}</h3>
                <span
                  class="rounded-full px-2 py-1 text-xs font-semibold"
                  :class="
                    agent.disabledAt ? 'bg-red-950 text-red-200' : 'bg-emerald-950 text-emerald-200'
                  "
                >
                  {{ agent.disabledAt ? 'Disabled' : 'Active' }}
                </span>
              </div>
              <p class="mt-1 text-sm text-slate-400">
                {{ agent.description || 'No description provided.' }}
              </p>
              <p class="mt-2 text-xs text-slate-500">
                Backing user: {{ agent.userId }} · Active keys: {{ activeKeyCount(agent) }}
              </p>
            </div>
            <button
              class="rounded-lg border px-3 py-2 text-sm font-semibold"
              :class="
                agent.disabledAt
                  ? 'border-emerald-800 text-emerald-200 hover:border-emerald-300'
                  : 'border-red-900 text-red-200 hover:border-red-300'
              "
              type="button"
              @click="setAgentDisabled(agent, !agent.disabledAt)"
            >
              {{ agent.disabledAt ? 'Enable' : 'Disable' }}
            </button>
          </div>

          <form class="mt-4 flex flex-col gap-2 md:flex-row" @submit.prevent="issueKey(agent)">
            <input
              v-model="keyNames[agent.id]"
              class="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="New key name"
              type="text"
            />
            <button
              class="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              :disabled="agent.disabledAt !== null || !keyNames[agent.id]?.trim()"
            >
              Issue key
            </button>
          </form>

          <div v-if="agent.apiKeys.length" class="mt-4 overflow-x-auto">
            <table class="min-w-full text-left text-sm">
              <thead class="text-xs uppercase text-slate-500">
                <tr>
                  <th class="py-2 pr-4">Name</th>
                  <th class="py-2 pr-4">Prefix</th>
                  <th class="py-2 pr-4">Last used</th>
                  <th class="py-2 pr-4">Status</th>
                  <th class="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="key in agent.apiKeys" :key="key.id">
                  <tr class="border-t border-slate-800">
                    <td class="py-3 pr-4 font-medium">{{ key.name }}</td>
                    <td class="py-3 pr-4 font-mono text-xs">{{ key.keyPrefix }}</td>
                    <td class="py-3 pr-4 text-slate-400">{{ formatDate(key.lastUsedAt) }}</td>
                    <td class="py-3 pr-4">
                      <span :class="key.revokedAt ? 'text-red-300' : 'text-emerald-300'">
                        {{ key.revokedAt ? 'Revoked' : 'Active' }}
                      </span>
                    </td>
                    <td class="py-3">
                      <button
                        v-if="!key.revokedAt"
                        class="rounded-lg border border-red-900 px-3 py-1 text-xs font-semibold text-red-200 hover:border-red-300"
                        type="button"
                        @click="revokeKey(agent, key)"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                  <tr v-if="issuedKeys[key.id]" class="border-t border-cyan-900/60">
                    <td colspan="5" class="py-3">
                      <div class="rounded-xl border border-cyan-900 bg-cyan-950/40 p-3">
                        <p class="text-sm font-semibold text-cyan-100">Copy this API key now.</p>
                        <p class="mt-1 text-xs text-cyan-200/80">
                          It is shown once and cannot be recovered after refresh.
                        </p>
                        <div class="mt-3 flex flex-col gap-2 md:flex-row">
                          <code
                            class="flex-1 overflow-x-auto rounded-lg bg-slate-950 px-3 py-2 text-xs text-cyan-100"
                          >
                            {{ issuedKeys[key.id] }}
                          </code>
                          <button
                            class="rounded-lg bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-950"
                            type="button"
                            @click="copyIssuedKey(issuedKeys[key.id])"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <p v-else class="mt-4 text-sm text-slate-500">No API keys issued yet.</p>
        </article>
      </div>
    </div>
  </section>
</template>
