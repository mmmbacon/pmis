import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { Task } from '../tasks/task.entity';
import { TimesheetEntry } from './timesheet-entry.entity';
import { Timesheet } from './timesheet.entity';
import { TimesheetsController } from './timesheets.controller';
import { TimesheetsService } from './timesheets.service';

@Module({
  imports: [TypeOrmModule.forFeature([Timesheet, TimesheetEntry, Task]), AuditModule, AuthModule],
  controllers: [TimesheetsController],
  providers: [TimesheetsService],
  exports: [TimesheetsService, TypeOrmModule],
})
export class TimesheetsModule {}
