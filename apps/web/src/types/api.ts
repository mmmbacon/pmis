export type RoleName = 'employee' | 'approver' | 'admin';
export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  name: string;
  roles: RoleName[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string | null;
  billable: boolean;
  hourlyRate: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  projectId: string;
  code: string;
  name: string;
  project?: Project;
}

export interface TimesheetEntry {
  id: string;
  taskId: string;
  workDate: string;
  hours: string;
  note: string | null;
  task?: Task;
}

export interface Timesheet {
  id: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  status: TimesheetStatus;
  submittedAt: string | null;
  decidedAt: string | null;
  decidedBy: string | null;
  decisionNote: string | null;
  user?: User;
  entries: TimesheetEntry[];
}

export interface TimesheetEntryInput {
  taskId: string;
  workDate: string;
  hours: number;
  note?: string;
}

export interface TimesheetInput {
  periodStart: string;
  periodEnd: string;
  entries: TimesheetEntryInput[];
}

export interface ProjectSummary {
  projectId: string;
  projectCode: string;
  projectName: string;
  billable: boolean;
  totalHours: number;
  hourlyRate: number;
  billableAmount: number;
}
