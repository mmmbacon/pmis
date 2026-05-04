import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import TimesheetGrid from './TimesheetGrid.vue';
import type { Task, Timesheet } from '../../types/api';

const task: Task = {
  id: 'task-1',
  projectId: 'project-1',
  code: 'ENG',
  name: 'Engineering',
};

describe('TimesheetGrid', () => {
  it('emits only positive-hour entries when saving a draft', async () => {
    const wrapper = mount(TimesheetGrid, {
      props: {
        tasks: [task],
        timesheet: null,
        editable: true,
        periodStart: '2026-04-27',
      },
    });

    await wrapper.get('[data-cy=hours-eng-mon]').setValue('6.5');
    await wrapper.get('input[placeholder="Note"]').setValue('Client implementation');
    await wrapper.get('[data-cy=save-timesheet]').trigger('click');

    expect(wrapper.emitted('save')).toEqual([
      [
        [
          {
            taskId: 'task-1',
            workDate: '2026-04-27',
            hours: 6.5,
            note: 'Client implementation',
          },
        ],
      ],
    ]);
  });

  it('preloads existing timesheet entries and hides save controls when locked', () => {
    const timesheet: Timesheet = {
      id: 'timesheet-1',
      userId: 'user-1',
      periodStart: '2026-04-27',
      periodEnd: '2026-05-03',
      status: 'submitted',
      submittedAt: '2026-04-28T12:00:00.000Z',
      decidedAt: null,
      decidedBy: null,
      decisionNote: null,
      entries: [
        {
          id: 'entry-1',
          taskId: 'task-1',
          workDate: '2026-04-29',
          hours: '7.50',
          note: 'Submitted work',
        },
      ],
    };

    const wrapper = mount(TimesheetGrid, {
      props: {
        tasks: [task],
        timesheet,
        editable: false,
        periodStart: '2026-04-27',
      },
    });

    const wedInput = wrapper.get<HTMLInputElement>('[data-cy=hours-eng-wed]');
    expect(wedInput.element.value).toBe('7.5');
    expect(wedInput.element.disabled).toBe(true);
    expect(wrapper.find('[data-cy=save-timesheet]').exists()).toBe(false);
    expect(wrapper.text()).toContain('This timesheet is locked from editing.');
  });
});
