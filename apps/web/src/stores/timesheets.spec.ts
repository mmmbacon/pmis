import { describe, expect, it } from 'vitest';
import { endOfWeek, startOfWeek, weekDayColumns } from './timesheets';

describe('timesheet date helpers', () => {
  it('finds the Monday start of a work week', () => {
    expect(startOfWeek(new Date('2026-05-01T12:00:00Z'))).toBe('2026-04-27');
  });

  it('finds the Sunday end of a work week', () => {
    expect(endOfWeek('2026-04-27')).toBe('2026-05-03');
  });

  it('builds Monday–Sunday columns for a timesheet week', () => {
    const cols = weekDayColumns('2026-04-27');
    expect(cols).toHaveLength(7);
    expect(cols[0]?.label).toBe('Mon');
    expect(cols[0]?.date).toBe('2026-04-27');
    expect(cols[6]?.label).toBe('Sun');
    expect(cols[6]?.date).toBe(endOfWeek('2026-04-27'));
  });
});
