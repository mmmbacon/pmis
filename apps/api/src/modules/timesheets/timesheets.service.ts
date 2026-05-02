import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AuthenticatedUser, hasRole } from '../../common/authenticated-user';
import { AuditService } from '../audit/audit.service';
import { Task } from '../tasks/task.entity';
import { UpsertTimesheetDto } from './dto/upsert-timesheet.dto';
import { TimesheetEntry } from './timesheet-entry.entity';
import {
  assertCanDecide,
  assertCanRequestCorrection,
  assertCanSubmit,
  isEditableStatus,
} from './timesheet-policy';
import { TimesheetStatus } from './timesheet-status';
import { Timesheet } from './timesheet.entity';

@Injectable()
export class TimesheetsService {
  constructor(
    @InjectRepository(Timesheet) private readonly timesheets: Repository<Timesheet>,
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  listForUser(user: AuthenticatedUser): Promise<Timesheet[]> {
    if (hasRole(user, 'approver') || hasRole(user, 'admin')) {
      return this.timesheets.find({
        relations: { user: true, entries: { task: { project: true } } },
        order: { periodStart: 'DESC' },
      });
    }
    return this.timesheets.find({
      where: { userId: user.id },
      relations: { user: true, entries: { task: { project: true } } },
      order: { periodStart: 'DESC' },
    });
  }

  async getForUser(id: string, user: AuthenticatedUser): Promise<Timesheet> {
    const timesheet = await this.findDetailed(id);
    if (timesheet.userId !== user.id && !hasRole(user, 'approver') && !hasRole(user, 'admin')) {
      throw new ForbiddenException('You cannot view this timesheet');
    }
    return timesheet;
  }

  async upsertDraft(user: AuthenticatedUser, dto: UpsertTimesheetDto): Promise<Timesheet> {
    this.validatePeriod(dto.periodStart, dto.periodEnd);
    this.validateEntriesWithinPeriod(dto);

    const taskIds = dto.entries.map((entry) => entry.taskId);
    const taskCount = await this.tasks.countBy({ id: In(taskIds) });
    if (taskCount !== new Set(taskIds).size) {
      throw new BadRequestException('One or more tasks do not exist');
    }

    return this.dataSource.transaction(async (manager) => {
      const timesheets = manager.getRepository(Timesheet);
      const entries = manager.getRepository(TimesheetEntry);
      let timesheet = await timesheets.findOne({
        where: { userId: user.id, periodStart: dto.periodStart },
        relations: { entries: true },
      });
      const before = timesheet ? this.snapshot(timesheet) : null;
      if (!timesheet) {
        timesheet = timesheets.create({
          userId: user.id,
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
          status: TimesheetStatus.Draft,
        });
      }
      if (!isEditableStatus(timesheet.status)) {
        throw new BadRequestException('Only draft or rejected timesheets can be edited');
      }
      timesheet.periodEnd = dto.periodEnd;
      timesheet.status = TimesheetStatus.Draft;
      timesheet.submittedAt = null;
      timesheet.decidedAt = null;
      timesheet.decidedBy = null;
      timesheet.decisionNote = null;
      const saved = await timesheets.save(timesheet);

      await entries.delete({ timesheetId: saved.id });
      await entries.save(
        dto.entries.map((entry) =>
          entries.create({
            timesheetId: saved.id,
            taskId: entry.taskId,
            workDate: entry.workDate,
            hours: entry.hours.toFixed(2),
            note: entry.note ?? null,
          }),
        ),
      );

      const detailed = await this.findDetailed(saved.id, manager);
      await this.auditService.record(
        {
          actorId: user.id,
          entityType: 'timesheet',
          entityId: saved.id,
          action: before ? 'timesheet.updated' : 'timesheet.created',
          before,
          after: this.snapshot(detailed),
        },
        manager,
      );
      return detailed;
    });
  }

  async submit(id: string, user: AuthenticatedUser): Promise<Timesheet> {
    return this.transition(id, user, TimesheetStatus.Submitted, 'timesheet.submitted');
  }

  async approve(id: string, actor: AuthenticatedUser, note?: string): Promise<Timesheet> {
    if (!hasRole(actor, 'approver') && !hasRole(actor, 'admin')) {
      throw new ForbiddenException('Only approvers can approve timesheets');
    }
    return this.transition(id, actor, TimesheetStatus.Approved, 'timesheet.approved', note);
  }

  async reject(id: string, actor: AuthenticatedUser, note?: string): Promise<Timesheet> {
    if (!hasRole(actor, 'approver') && !hasRole(actor, 'admin')) {
      throw new ForbiddenException('Only approvers can reject timesheets');
    }
    return this.transition(id, actor, TimesheetStatus.Rejected, 'timesheet.rejected', note);
  }

  async requestCorrection(id: string, actor: AuthenticatedUser, note?: string): Promise<Timesheet> {
    const timesheet = await this.findDetailed(id);
    if (timesheet.userId !== actor.id && !hasRole(actor, 'approver') && !hasRole(actor, 'admin')) {
      throw new ForbiddenException('You cannot request correction for this timesheet');
    }
    assertCanRequestCorrection(timesheet.status);
    return this.transition(
      id,
      actor,
      TimesheetStatus.Rejected,
      'timesheet.correction_requested',
      note,
    );
  }

  async listSubmitted(actor: AuthenticatedUser): Promise<Timesheet[]> {
    if (!hasRole(actor, 'approver') && !hasRole(actor, 'admin')) {
      throw new ForbiddenException('Only approvers can view submitted timesheets');
    }
    return this.timesheets.find({
      where: { status: TimesheetStatus.Submitted },
      relations: { user: true, entries: { task: { project: true } } },
      order: { periodStart: 'ASC' },
    });
  }

  private async transition(
    id: string,
    actor: AuthenticatedUser,
    status: TimesheetStatus,
    action: string,
    note?: string,
  ): Promise<Timesheet> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Timesheet);
      const timesheet = await this.findDetailed(id, manager);
      const before = this.snapshot(timesheet);

      if (status === TimesheetStatus.Submitted) {
        if (timesheet.userId !== actor.id) {
          throw new ForbiddenException('Only the owner can submit this timesheet');
        }
        assertCanSubmit(timesheet.status, timesheet.entries.length);
        timesheet.submittedAt = new Date();
        timesheet.decidedAt = null;
        timesheet.decidedBy = null;
        timesheet.decisionNote = null;
      } else if ([TimesheetStatus.Approved, TimesheetStatus.Rejected].includes(status)) {
        if (action !== 'timesheet.correction_requested') {
          assertCanDecide(timesheet.status);
        }
        timesheet.decidedAt = new Date();
        timesheet.decidedBy = actor.id;
        timesheet.decisionNote = note ?? null;
      }

      timesheet.status = status;
      await repository.save(timesheet);
      const detailed = await this.findDetailed(id, manager);
      await this.auditService.record(
        {
          actorId: actor.id,
          entityType: 'timesheet',
          entityId: id,
          action,
          before,
          after: this.snapshot(detailed),
        },
        manager,
      );
      return detailed;
    });
  }

  private async findDetailed(id: string, manager = this.dataSource.manager): Promise<Timesheet> {
    const timesheet = await manager.getRepository(Timesheet).findOne({
      where: { id },
      relations: { user: true, entries: { task: { project: true } } },
      order: { entries: { workDate: 'ASC' } },
    });
    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }
    return timesheet;
  }

  private validatePeriod(periodStart: string, periodEnd: string): void {
    const start = new Date(`${periodStart}T00:00:00Z`);
    const end = new Date(`${periodEnd}T00:00:00Z`);
    if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
      throw new BadRequestException('Invalid period dates');
    }
    const days = Math.round((end.valueOf() - start.valueOf()) / 86_400_000) + 1;
    if (days !== 7) {
      throw new BadRequestException('Timesheet periods must be exactly seven days');
    }
  }

  private validateEntriesWithinPeriod(dto: UpsertTimesheetDto): void {
    for (const entry of dto.entries) {
      if (entry.workDate < dto.periodStart || entry.workDate > dto.periodEnd) {
        throw new BadRequestException('Entry work dates must fall inside the timesheet period');
      }
    }
  }

  private snapshot(timesheet: Timesheet): Record<string, unknown> {
    return {
      id: timesheet.id,
      userId: timesheet.userId,
      periodStart: timesheet.periodStart,
      periodEnd: timesheet.periodEnd,
      status: timesheet.status,
      submittedAt: timesheet.submittedAt,
      decidedAt: timesheet.decidedAt,
      decidedBy: timesheet.decidedBy,
      decisionNote: timesheet.decisionNote,
      entries: timesheet.entries?.map((entry) => ({
        id: entry.id,
        taskId: entry.taskId,
        workDate: entry.workDate,
        hours: entry.hours,
        note: entry.note,
      })),
    };
  }
}
