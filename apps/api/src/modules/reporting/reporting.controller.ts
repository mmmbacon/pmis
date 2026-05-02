import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectSummary, ReportingService } from './reporting.service';

@Controller('reporting')
@UseGuards(JwtAuthGuard)
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('projects')
  projectSummary(@Query('start') start?: string, @Query('end') end?: string): Promise<ProjectSummary[]> {
    return this.reportingService.projectSummary(start, end);
  }
}
