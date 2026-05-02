<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import StatusBadge from '../components/layout/StatusBadge.vue';
import { endOfWeek, startOfWeek, useTimesheetStore, weekDayColumns } from '../stores/timesheets';
import type { Timesheet } from '../types/api';

const timesheets = useTimesheetStore();

const selectedWeekStart = ref(startOfWeek());

const addDays = (iso: string, delta: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
};

const goPrevWeek = (): void => {
  selectedWeekStart.value = addDays(selectedWeekStart.value, -7);
};

const goNextWeek = (): void => {
  selectedWeekStart.value = addDays(selectedWeekStart.value, 7);
};

const goThisWeek = (): void => {
  selectedWeekStart.value = startOfWeek();
};

const queueForWeek = computed(() =>
  timesheets.approvals.filter((ts) => ts.periodStart === selectedWeekStart.value),
);

interface ApprovalTaskRow {
  taskId: string;
  taskLabel: string;
  taskName: string;
  hoursByDate: Record<string, string>;
  note: string | null;
}

const buildRows = (ts: Timesheet): ApprovalTaskRow[] => {
  const map = new Map<string, ApprovalTaskRow>();
  for (const entry of ts.entries) {
    let row = map.get(entry.taskId);
    if (!row) {
      row = {
        taskId: entry.taskId,
        taskLabel: `${entry.task?.project?.code ?? '—'} / ${entry.task?.code ?? '—'}`,
        taskName: entry.task?.name ?? '',
        hoursByDate: {},
        note: null,
      };
      map.set(entry.taskId, row);
    }
    row.hoursByDate[entry.workDate] = entry.hours;
    if (entry.note?.trim()) {
      row.note = row.note ? `${row.note}; ${entry.note}` : entry.note;
    }
  }
  return [...map.values()];
};

const totalHours = (ts: Timesheet): number =>
  ts.entries.reduce((sum, entry) => sum + Number(entry.hours), 0);

onMounted(() => {
  void timesheets.loadApprovals();
});
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold">Approval Queue</h1>
        <p class="text-slate-400">Review submitted timesheets by week and record decisions.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button class="border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700" type="button" @click="goPrevWeek">
          Previous week
        </button>
        <button class="border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700" type="button" @click="goThisWeek">
          This week
        </button>
        <button class="border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700" type="button" @click="goNextWeek">
          Next week
        </button>
      </div>
    </div>

    <div class="rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-4">
      <p class="text-sm font-medium text-slate-200">
        Week of {{ selectedWeekStart }} through {{ endOfWeek(selectedWeekStart) }}
      </p>
      <p class="mt-1 text-sm text-slate-400">
        {{ queueForWeek.length }} submitted timesheet{{ queueForWeek.length === 1 ? '' : 's' }} in this week.
      </p>
    </div>

    <div v-if="queueForWeek.length === 0" class="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-400">
      No submitted timesheets for this week.
    </div>

    <article
      v-for="timesheet in queueForWeek"
      :key="timesheet.id"
      class="rounded-2xl border border-slate-800 bg-slate-900 p-5"
      data-cy="approval-card"
    >
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold">{{ timesheet.user?.name }}</h2>
          <p class="text-sm text-slate-400">{{ timesheet.periodStart }} – {{ timesheet.periodEnd }}</p>
          <p class="mt-1 text-sm text-slate-500">Total: {{ totalHours(timesheet).toFixed(2) }} hours</p>
        </div>
        <StatusBadge :status="timesheet.status" />
      </div>

      <div class="mt-4 overflow-x-auto rounded-xl border border-slate-800">
        <table class="w-full min-w-[640px] text-left text-sm">
          <thead class="bg-slate-950 text-slate-400">
            <tr>
              <th class="p-3">Task</th>
              <th v-for="day in weekDayColumns(timesheet.periodStart)" :key="day.date" class="p-3 text-center">
                <span class="block font-semibold text-slate-200">{{ day.label }}</span>
                <span class="text-xs">{{ day.date.slice(5) }}</span>
              </th>
              <th class="w-12 p-3 text-center" scope="col">
                <span class="sr-only">Entry notes</span>
                <svg
                  class="mx-auto h-4 w-4 text-slate-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in buildRows(timesheet)" :key="row.taskId" class="border-t border-slate-800 bg-slate-950/60">
              <td class="w-48 p-3">
                <p class="font-medium text-slate-100">{{ row.taskLabel }}</p>
                <p class="text-xs text-slate-400">{{ row.taskName }}</p>
              </td>
              <td v-for="day in weekDayColumns(timesheet.periodStart)" :key="day.date" class="p-2 text-center tabular-nums text-slate-200">
                {{ row.hoursByDate[day.date] ?? '—' }}
              </td>
              <td class="w-12 p-2 text-center align-middle">
                <span v-if="row.note" class="group relative inline-flex justify-center">
                  <button
                    class="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/80"
                    type="button"
                    :aria-describedby="`approval-note-${timesheet.id}-${row.taskId}`"
                    aria-label="Entry note"
                  >
                    <svg
                      class="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </button>
                  <span
                    :id="`approval-note-${timesheet.id}-${row.taskId}`"
                    class="sr-only"
                  >
                    {{ row.note }}
                  </span>
                  <span
                    class="pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 w-max max-w-xs -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-left text-xs leading-snug text-slate-200 opacity-0 shadow-lg ring-1 ring-black/20 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
                    role="tooltip"
                    aria-hidden="true"
                  >
                    {{ row.note }}
                  </span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-5 flex justify-end gap-3">
        <button class="bg-rose-500 text-white hover:bg-rose-400" type="button" @click="timesheets.reject(timesheet.id)">Reject</button>
        <button class="bg-emerald-500 text-slate-950 hover:bg-emerald-400" data-cy="approve-timesheet" type="button" @click="timesheets.approve(timesheet.id)">
          Approve
        </button>
      </div>
    </article>
  </section>
</template>
