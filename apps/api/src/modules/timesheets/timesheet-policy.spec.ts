import { BadRequestException } from '@nestjs/common';
import { assertCanDecide, assertCanRequestCorrection, assertCanSubmit, isEditableStatus } from './timesheet-policy';
import { TimesheetStatus } from './timesheet-status';

describe('timesheet policy', () => {
  it('allows only draft and rejected timesheets to be edited', () => {
    expect(isEditableStatus(TimesheetStatus.Draft)).toBe(true);
    expect(isEditableStatus(TimesheetStatus.Rejected)).toBe(true);
    expect(isEditableStatus(TimesheetStatus.Submitted)).toBe(false);
    expect(isEditableStatus(TimesheetStatus.Approved)).toBe(false);
  });

  it('requires editable status and entries before submission', () => {
    expect(() => assertCanSubmit(TimesheetStatus.Draft, 1)).not.toThrow();
    expect(() => assertCanSubmit(TimesheetStatus.Approved, 1)).toThrow(BadRequestException);
    expect(() => assertCanSubmit(TimesheetStatus.Draft, 0)).toThrow(BadRequestException);
  });

  it('allows decisions only on submitted timesheets', () => {
    expect(() => assertCanDecide(TimesheetStatus.Submitted)).not.toThrow();
    expect(() => assertCanDecide(TimesheetStatus.Draft)).toThrow(BadRequestException);
  });

  it('allows correction requests only on approved timesheets', () => {
    expect(() => assertCanRequestCorrection(TimesheetStatus.Approved)).not.toThrow();
    expect(() => assertCanRequestCorrection(TimesheetStatus.Submitted)).toThrow(BadRequestException);
  });
});
