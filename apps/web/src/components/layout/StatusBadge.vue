<script setup lang="ts">
import type { TimesheetStatus } from '../../types/api';

defineProps<{ status: TimesheetStatus }>();
</script>

<template>
  <span
    class="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
    :class="{
      'bg-slate-700 text-slate-100': status === 'draft',
      'bg-amber-500/20 text-amber-200': status === 'submitted',
      'bg-emerald-500/20 text-emerald-200': status === 'approved',
      'bg-rose-500/20 text-rose-200': status === 'rejected',
    }"
  >
    {{ status }}
  </span>
</template>
