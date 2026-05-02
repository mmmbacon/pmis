import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export type ThemeId = 'spring' | 'summer' | 'autumn' | 'winter';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
}

const storageKey = 'timesheet.theme';

export const themeOptions: ThemeOption[] = [
  {
    id: 'spring',
    name: 'Spring',
    description: 'Fresh greens with soft floral accents.',
  },
  {
    id: 'summer',
    name: 'Summer',
    description: 'Bright cyan and deep ocean blues.',
  },
  {
    id: 'autumn',
    name: 'Autumn',
    description: 'Warm amber, rust, and harvest tones.',
  },
  {
    id: 'winter',
    name: 'Winter',
    description: 'Cool slate with crisp icy highlights.',
  },
];

const isThemeId = (value: string | null): value is ThemeId =>
  value === 'spring' || value === 'summer' || value === 'autumn' || value === 'winter';

const fallbackTheme: ThemeOption = {
  id: 'winter',
  name: 'Winter',
  description: 'Cool slate with crisp icy highlights.',
};

export const useThemeStore = defineStore('theme', () => {
  const storedTheme = localStorage.getItem(storageKey);
  const selectedTheme = ref<ThemeId>(isThemeId(storedTheme) ? storedTheme : 'winter');

  const currentTheme = computed<ThemeOption>(
    () => themeOptions.find((theme) => theme.id === selectedTheme.value) ?? fallbackTheme,
  );

  const applyTheme = (): void => {
    document.documentElement.dataset.theme = selectedTheme.value;
  };

  const setTheme = (theme: ThemeId): void => {
    selectedTheme.value = theme;
    localStorage.setItem(storageKey, theme);
    applyTheme();
  };

  applyTheme();

  return { selectedTheme, currentTheme, themeOptions, setTheme };
});
