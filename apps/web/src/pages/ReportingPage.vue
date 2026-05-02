<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useTimesheetStore } from '../stores/timesheets';

const timesheets = useTimesheetStore();
const totalAmount = computed(() =>
  timesheets.summaries.reduce((sum, row) => sum + row.billableAmount, 0),
);
const totalHours = computed(() =>
  timesheets.summaries.reduce((sum, row) => sum + row.totalHours, 0),
);

onMounted(() => {
  void timesheets.loadSummaries();
});
</script>

<template>
  <section class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold">Project Reporting</h1>
      <p class="text-slate-400">Hours and rate-derived totals for submitted and approved time.</p>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div class="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <p class="text-sm text-slate-400">Total hours</p>
        <p class="text-3xl font-bold text-cyan-300">{{ totalHours.toFixed(2) }}</p>
      </div>
      <div class="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <p class="text-sm text-slate-400">Billable amount</p>
        <p class="text-3xl font-bold text-emerald-300">${{ totalAmount.toFixed(2) }}</p>
      </div>
    </div>

    <div class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-950 text-slate-400">
          <tr>
            <th class="p-3">Project</th>
            <th class="p-3">Billable</th>
            <th class="p-3">Hours</th>
            <th class="p-3">Rate</th>
            <th class="p-3">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="summary in timesheets.summaries"
            :key="summary.projectId"
            class="border-t border-slate-800"
            data-cy="report-row"
          >
            <td class="p-3">{{ summary.projectCode }} - {{ summary.projectName }}</td>
            <td class="p-3">{{ summary.billable ? 'Yes' : 'No' }}</td>
            <td class="p-3">{{ summary.totalHours.toFixed(2) }}</td>
            <td class="p-3">${{ summary.hourlyRate.toFixed(2) }}</td>
            <td class="p-3">${{ summary.billableAmount.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
