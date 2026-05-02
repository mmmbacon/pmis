<script setup lang="ts">
import { computed, onMounted } from 'vue';
import StatusBadge from '../components/layout/StatusBadge.vue';
import TimesheetGrid from '../components/timesheets/TimesheetGrid.vue';
import { useProjectStore } from '../stores/projects';
import { endOfWeek, startOfWeek, useTimesheetStore } from '../stores/timesheets';
import type { TimesheetEntryInput } from '../types/api';

const projects = useProjectStore();
const timesheets = useTimesheetStore();
const periodStart = startOfWeek();
const editable = computed(
  () => !timesheets.current || ['draft', 'rejected'].includes(timesheets.current.status),
);

onMounted(async () => {
  await Promise.all([projects.load(), timesheets.loadMine()]);
});

const save = async (entries: TimesheetEntryInput[]): Promise<void> => {
  await timesheets.saveDraft(entries, periodStart);
};

const submit = async (): Promise<void> => {
  if (timesheets.current) {
    await timesheets.submit(timesheets.current.id);
  }
};
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">My Timesheet</h1>
        <p class="text-slate-400">Week of {{ periodStart }} through {{ endOfWeek(periodStart) }}</p>
      </div>
      <StatusBadge v-if="timesheets.current" :status="timesheets.current.status" />
    </div>

    <TimesheetGrid
      :tasks="projects.tasks"
      :timesheet="timesheets.current"
      :editable="editable"
      :period-start="periodStart"
      @save="save"
    />

    <div class="flex justify-end">
      <button
        v-if="timesheets.current && editable"
        class="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
        data-cy="submit-timesheet"
        type="button"
        @click="submit"
      >
        Submit week
      </button>
    </div>

    <div class="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h2 class="mb-3 text-lg font-semibold">Recent Timesheets</h2>
      <div class="space-y-2">
        <div
          v-for="timesheet in timesheets.timesheets"
          :key="timesheet.id"
          class="flex items-center justify-between rounded-xl bg-slate-950 p-3"
        >
          <span>{{ timesheet.periodStart }} - {{ timesheet.periodEnd }}</span>
          <StatusBadge :status="timesheet.status" />
        </div>
      </div>
    </div>
  </section>
</template>
