import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ApprovalsPage from './ApprovalsPage.vue';
import { startOfWeek } from '../stores/timesheets';
import type { Timesheet } from '../types/api';

const submittedTimesheet = (): Timesheet => ({
  id: 'timesheet-1',
  userId: 'user-1',
  periodStart: startOfWeek(),
  periodEnd: '2026-05-10',
  status: 'submitted',
  submittedAt: null,
  decidedAt: null,
  decidedBy: null,
  decisionNote: null,
  user: {
    id: 'user-1',
    email: 'employee@example.com',
    name: 'Example Employee',
    roles: ['employee'],
  },
  entries: [
    {
      id: 'entry-1',
      taskId: 'task-1',
      workDate: startOfWeek(),
      hours: '8.00',
      note: 'Needs reviewer context',
      task: {
        id: 'task-1',
        projectId: 'project-1',
        code: 'OPS',
        name: 'Operations',
        project: {
          id: 'project-1',
          code: 'ACME',
          name: 'Acme',
          description: null,
          billable: true,
          hourlyRate: '125.00',
          tasks: [],
        },
      },
    },
  ],
});

vi.mock('../api/client', () => ({
  approvalsApi: {
    approve: vi.fn(),
    list: vi.fn(() => Promise.resolve([submittedTimesheet()])),
    reject: vi.fn(),
  },
  reportingApi: {
    projectSummary: vi.fn(),
  },
  timesheetsApi: {
    list: vi.fn(),
    save: vi.fn(),
    submit: vi.fn(),
  },
}));

describe('ApprovalsPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('teleports approval note tooltip outside the clipped table scroller', async () => {
    const wrapper = mount(ApprovalsPage, { attachTo: document.body });
    await flushPromises();

    const trigger = wrapper.get('[data-cy=approval-note-trigger]');
    await trigger.trigger('mouseenter');

    const tooltip = document.querySelector('[data-cy=approval-note-tooltip]');
    expect(tooltip?.textContent).toContain('Needs reviewer context');
    expect(tooltip?.closest('.overflow-x-auto')).toBeNull();
  });
});
