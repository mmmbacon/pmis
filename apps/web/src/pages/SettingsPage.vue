<script setup lang="ts">
import { useThemeStore, type ThemeId } from '../stores/theme';

const theme = useThemeStore();

const selectTheme = (themeId: ThemeId): void => {
  theme.setTheme(themeId);
};
</script>

<template>
  <section class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold">Settings</h1>
      <p class="text-slate-400">Choose a seasonal color scheme for the workspace.</p>
    </div>

    <div class="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h2 class="text-xl font-semibold">Color Scheme</h2>
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
  </section>
</template>
