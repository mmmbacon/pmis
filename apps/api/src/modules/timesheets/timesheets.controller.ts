import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../../common/authenticated-user';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DecisionDto } from '../approvals/dto/decision.dto';
import { UpsertTimesheetDto } from './dto/upsert-timesheet.dto';
import { Timesheet } from './timesheet.entity';
import { TimesheetsService } from './timesheets.service';

@Controller('timesheets')
@UseGuards(JwtAuthGuard)
export class TimesheetsController {
  constructor(private readonly timesheetsService: TimesheetsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<Timesheet[]> {
    return this.timesheetsService.listForUser(user);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser): Promise<Timesheet> {
    return this.timesheetsService.getForUser(id, user);
  }

  @Post()
  upsert(
    @Body() dto: UpsertTimesheetDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Timesheet> {
    return this.timesheetsService.upsertDraft(user, dto);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser): Promise<Timesheet> {
    return this.timesheetsService.submit(id, user);
  }

  @Post(':id/request-correction')
  requestCorrection(
    @Param('id') id: string,
    @Body() dto: DecisionDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Timesheet> {
    return this.timesheetsService.requestCorrection(id, user, dto.note);
  }
}
