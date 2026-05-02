import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { approvalsApi, reportingApi, timesheetsApi } from '../api/client';
import type { ProjectSummary, Timesheet, TimesheetEntryInput, TimesheetInput } from '../types/api';

const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

export const startOfWeek = (date = new Date()): string => {
  const value = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() - day + 1);
  return isoDate(value);
};

export const endOfWeek = (periodStart: string): string => {
  const value = new Date(`${periodStart}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 6);
  return isoDate(value);
};

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export interface WeekDayColumn {
  label: string;
  date: string;
}

/** Monday–Sunday columns for the ISO week starting at `periodStart`. */
export const weekDayColumns = (periodStart: string): WeekDayColumn[] => {
  const start = new Date(`${periodStart}T00:00:00Z`);
  return Array.from({ length: 7 }, (unused, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return {
      label: WEEKDAY_LABELS[index] ?? '',
      date: date.toISOString().slice(0, 10),
    };
  });
};

export const useTimesheetStore = defineStore('timesheets', () => {
  const timesheets = ref<Timesheet[]>([]);
  const approvals = ref<Timesheet[]>([]);
  const summaries = ref<ProjectSummary[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const current = computed(() => timesheets.value[0] ?? null);

  const loadMine = async (): Promise<void> => {
    loading.value = true;
    try {
      timesheets.value = await timesheetsApi.list();
    } finally {
      loading.value = false;
    }
  };

  const saveDraft = async (
    entries: TimesheetEntryInput[],
    periodStart = startOfWeek(),
  ): Promise<Timesheet> => {
    error.value = null;
    const input: TimesheetInput = { periodStart, periodEnd: endOfWeek(periodStart), entries };
    const saved = await timesheetsApi.save(input);
    await loadMine();
    return saved;
  };

  const submit = async (id: string): Promise<void> => {
    await timesheetsApi.submit(id);
    await loadMine();
  };

  const loadApprovals = async (): Promise<void> => {
    approvals.value = await approvalsApi.list();
  };

  const approve = async (id: string): Promise<void> => {
    await approvalsApi.approve(id, 'Approved from local demo UI');
    await loadApprovals();
  };

  const reject = async (id: string): Promise<void> => {
    await approvalsApi.reject(id, 'Rejected from local demo UI');
    await loadApprovals();
  };

  const loadSummaries = async (): Promise<void> => {
    summaries.value = await reportingApi.projectSummary();
  };

  return {
    timesheets,
    approvals,
    summaries,
    loading,
    error,
    current,
    loadMine,
    saveDraft,
    submit,
    loadApprovals,
    approve,
    reject,
    loadSummaries,
  };
});
