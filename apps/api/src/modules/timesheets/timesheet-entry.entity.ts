import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Task } from '../tasks/task.entity';
import { Timesheet } from './timesheet.entity';

@Entity('timesheet_entries')
@Index(['timesheetId', 'workDate', 'taskId'], { unique: true })
export class TimesheetEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'timesheet_id', type: 'uuid' })
  timesheetId!: string;

  @Column({ name: 'task_id', type: 'uuid' })
  taskId!: string;

  @Column({ name: 'work_date', type: 'date' })
  workDate!: string;

  @Column({ type: 'numeric', precision: 5, scale: 2 })
  hours!: string;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Timesheet, (timesheet) => timesheet.entries, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'timesheet_id' })
  timesheet!: Timesheet;

  @ManyToOne(() => Task, { nullable: false })
  @JoinColumn({ name: 'task_id' })
  task!: Task;
}
