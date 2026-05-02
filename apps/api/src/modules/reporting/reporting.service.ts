import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimesheetEntry } from '../timesheets/timesheet-entry.entity';

export interface ProjectSummary {
  projectId: string;
  projectCode: string;
  projectName: string;
  billable: boolean;
  totalHours: number;
  hourlyRate: number;
  billableAmount: number;
}

interface ProjectSummaryRow {
  projectId: string;
  projectCode: string;
  projectName: string;
  billable: boolean;
  totalHours: string;
  hourlyRate: string;
  billableAmount: string;
}

@Injectable()
export class ReportingService {
  constructor(@InjectRepository(TimesheetEntry) private readonly entries: Repository<TimesheetEntry>) {}

  async projectSummary(start?: string, end?: string): Promise<ProjectSummary[]> {
    const query = this.entries
      .createQueryBuilder('entry')
      .innerJoin('entry.timesheet', 'timesheet')
      .innerJoin('entry.task', 'task')
      .innerJoin('task.project', 'project')
      .select('project.id', 'projectId')
      .addSelect('project.code', 'projectCode')
      .addSelect('project.name', 'projectName')
      .addSelect('project.billable', 'billable')
      .addSelect('project.hourly_rate', 'hourlyRate')
      .addSelect('COALESCE(SUM(entry.hours), 0)', 'totalHours')
      .addSelect(
        "CASE WHEN project.billable THEN COALESCE(SUM(entry.hours * project.hourly_rate), 0) ELSE 0 END",
        'billableAmount',
      )
      .where("timesheet.status IN ('submitted', 'approved')")
      .groupBy('project.id')
      .addGroupBy('project.code')
      .addGroupBy('project.name')
      .addGroupBy('project.billable')
      .addGroupBy('project.hourly_rate')
      .orderBy('project.code', 'ASC');

    if (start) {
      query.andWhere('entry.work_date >= :start', { start });
    }
    if (end) {
      query.andWhere('entry.work_date <= :end', { end });
    }

    const rows = await query.getRawMany<ProjectSummaryRow>();
    return rows.map((row) => ({
      projectId: row.projectId,
      projectCode: row.projectCode,
      projectName: row.projectName,
      billable: row.billable,
      totalHours: Number(row.totalHours),
      hourlyRate: Number(row.hourlyRate),
      billableAmount: Number(row.billableAmount),
    }));
  }
}
