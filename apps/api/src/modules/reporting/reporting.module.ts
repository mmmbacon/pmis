import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { TimesheetEntry } from '../timesheets/timesheet-entry.entity';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';

@Module({
  imports: [TypeOrmModule.forFeature([TimesheetEntry]), AuthModule],
  controllers: [ReportingController],
  providers: [ReportingService],
})
export class ReportingModule {}
