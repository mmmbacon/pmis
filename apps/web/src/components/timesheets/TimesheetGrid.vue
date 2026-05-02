<script setup lang="ts">
import { computed, reactive, watchEffect } from 'vue';
import type { Task, Timesheet, TimesheetEntryInput } from '../../types/api';
import { weekDayColumns } from '../../stores/timesheets';

const props = defineProps<{
  tasks: Task[];
  timesheet: Timesheet | null;
  editable: boolean;
  periodStart: string;
}>();

const emit = defineEmits<{ save: [entries: TimesheetEntryInput[]] }>();

interface TaskDraft {
  taskId: string;
  note: string;
  hoursByDate: Record<string, number>;
}

interface TaskDraftRow {
  task: Task;
  draft: TaskDraft;
}

const draft = reactive<Record<string, TaskDraft>>({});

const days = computed(() => weekDayColumns(props.periodStart));

watchEffect(() => {
  for (const taskId of Object.keys(draft)) {
    if (!props.tasks.some((task) => task.id === taskId)) {
      delete draft[taskId];
    }
  }

  for (const task of props.tasks) {
    const existing = draft[task.id];
    draft[task.id] = {
      taskId: task.id,
      note: existing?.note ?? '',
      hoursByDate: Object.fromEntries(days.value.map((day) => [day.date, existing?.hoursByDate[day.date] ?? 0])),
    };
  }

  for (const entry of props.timesheet?.entries ?? []) {
    const taskDraft = draft[entry.taskId];
    if (taskDraft) {
      taskDraft.hoursByDate[entry.workDate] = Number(entry.hours);
      taskDraft.note = entry.note ?? taskDraft.note;
    }
  }

  const firstTask = props.tasks[0];
  if (!props.timesheet?.entries.length && firstTask && days.value[0]) {
    const firstDraft = draft[firstTask.id];
    if (firstDraft) {
      firstDraft.hoursByDate[days.value[0].date] = 8;
      firstDraft.note = 'Demo work';
    }
  }
});

const rows = computed<TaskDraftRow[]>(() =>
  props.tasks.flatMap((task) => {
    const taskDraft = draft[task.id];
    return taskDraft ? [{ task, draft: taskDraft }] : [];
  }),
);

const totalHours = computed(() =>
  Object.values(draft).reduce(
    (sum, row) => sum + Object.values(row.hoursByDate).reduce((rowSum, hours) => rowSum + Number(hours || 0), 0),
    0,
  ),
);

const save = (): void => {
  const entries = Object.values(draft).flatMap((row): TimesheetEntryInput[] =>
    days.value
      .filter((day) => Number(row.hoursByDate[day.date] || 0) > 0)
      .map((day) => {
        const entry: TimesheetEntryInput = {
          taskId: row.taskId,
          workDate: day.date,
          hours: Number(row.hoursByDate[day.date]),
        };
        if (row.note.trim()) {
          entry.note = row.note.trim();
        }
        return entry;
      }),
  );
  emit('save', entries);
};
</script>

<template>
  <div class="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold">Weekly Entries</h2>
        <p class="text-sm text-slate-400">Total: {{ totalHours.toFixed(2) }} hours</p>
      </div>
      <p class="text-sm text-slate-400">Enter hours per task, by day.</p>
    </div>

    <div class="overflow-x-auto rounded-xl border border-slate-800">
      <table class="w-full min-w-[780px] text-left text-sm">
        <thead class="bg-slate-950 text-slate-400">
          <tr>
            <th class="p-3">Task</th>
            <th v-for="day in days" :key="day.date" class="p-3 text-center">
              <span class="block font-semibold text-slate-200">{{ day.label }}</span>
              <span class="text-xs">{{ day.date.slice(5) }}</span>
            </th>
            <th class="p-3">Note</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.task.id" class="border-t border-slate-800 bg-slate-950/60">
            <td class="w-48 p-3">
              <p class="font-medium text-slate-100">
                {{ row.task.project?.code ?? 'Project' }} / {{ row.task.code }}
              </p>
              <p class="text-xs text-slate-400">{{ row.task.name }}</p>
            </td>
            <td v-for="day in days" :key="day.date" class="p-2">
              <input
                v-model.number="row.draft.hoursByDate[day.date]"
                :aria-label="`${row.task.code} ${day.label} hours`"
                class="w-16 text-center"
                :data-cy="`hours-${row.task.code.toLowerCase()}-${day.label.toLowerCase()}`"
                :disabled="!editable"
                min="0"
                max="24"
                step="0.25"
                type="number"
              />
            </td>
            <td class="w-40 p-3">
              <input v-model="row.draft.note" class="w-full" :disabled="!editable" placeholder="Note" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-5 flex justify-end">
      <button v-if="editable" class="bg-cyan-500 text-slate-950 hover:bg-cyan-400" data-cy="save-timesheet" type="button" @click="save">
        Save draft
      </button>
      <p v-else class="text-sm text-slate-400">This timesheet is locked from editing.</p>
    </div>
  </div>
</template>
