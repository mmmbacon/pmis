import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { projectsApi } from '../api/client';
import type { Project, Task } from '../types/api';

export const useProjectStore = defineStore('projects', () => {
  const projects = ref<Project[]>([]);
  const loading = ref(false);

  const tasks = computed<Task[]>(() =>
    projects.value.flatMap((project) =>
      (project.tasks ?? []).map((task) => ({ ...task, project })),
    ),
  );

  const load = async (): Promise<void> => {
    loading.value = true;
    try {
      projects.value = await projectsApi.list();
    } finally {
      loading.value = false;
    }
  };

  return { projects, tasks, loading, load };
});
