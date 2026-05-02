import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../../common/authenticated-user';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Timesheet } from '../timesheets/timesheet.entity';
import { TimesheetsService } from '../timesheets/timesheets.service';
import { DecisionDto } from './dto/decision.dto';

@Controller('approvals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('approver', 'admin')
export class ApprovalsController {
  constructor(private readonly timesheetsService: TimesheetsService) {}

  @Get()
  listSubmitted(@CurrentUser() user: AuthenticatedUser): Promise<Timesheet[]> {
    return this.timesheetsService.listSubmitted(user);
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: DecisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Timesheet> {
    return this.timesheetsService.approve(id, user, dto.note);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: DecisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Timesheet> {
    return this.timesheetsService.reject(id, user, dto.note);
  }
}
