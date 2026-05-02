import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TimesheetsModule } from '../timesheets/timesheets.module';
import { ApprovalsController } from './approvals.controller';

@Module({
  imports: [AuthModule, TimesheetsModule],
  controllers: [ApprovalsController],
})
export class ApprovalsModule {}
