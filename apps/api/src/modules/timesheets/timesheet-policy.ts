import { BadRequestException } from '@nestjs/common';
import { TimesheetStatus } from './timesheet-status';

export const isEditableStatus = (status: TimesheetStatus): boolean =>
  status === TimesheetStatus.Draft || status === TimesheetStatus.Rejected;

export const assertCanSubmit = (status: TimesheetStatus, entryCount: number): void => {
  if (!isEditableStatus(status)) {
    throw new BadRequestException('Only draft or rejected timesheets can be submitted');
  }
  if (entryCount === 0) {
    throw new BadRequestException('Timesheet must have at least one entry');
  }
};

export const assertCanDecide = (status: TimesheetStatus): void => {
  if (status !== TimesheetStatus.Submitted) {
    throw new BadRequestException('Only submitted timesheets can be decided');
  }
};

export const assertCanRequestCorrection = (status: TimesheetStatus): void => {
  if (status !== TimesheetStatus.Approved) {
    throw new BadRequestException('Only approved timesheets can receive correction requests');
  }
};
