import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Task } from '../tasks/task.entity';
import { TasksService } from '../tasks/tasks.service';
import { Timesheet } from '../timesheets/timesheet.entity';
import { TimesheetsService } from '../timesheets/timesheets.service';
import { AgentApiKeyGuard } from './agent-api-key.guard';
import { AgentPrincipal } from './agent-principal';
import { CurrentAgent } from './current-agent.decorator';
import { AgentPrincipalResponseDto } from './dto/agent-response.dto';
import { AgentTimeEntryDto } from './dto/agent-time-entry.dto';

@ApiTags('agent')
@ApiBearerAuth('agent-api-key')
@Controller('agent')
@UseGuards(AgentApiKeyGuard)
export class AgentController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly timesheetsService: TimesheetsService,
  ) {}

  @Get('me')
  @ApiOkResponse({ type: AgentPrincipalResponseDto })
  me(@CurrentAgent() agent: AgentPrincipal): AgentPrincipalResponseDto {
    return agent;
  }

  @Get('tasks')
  @ApiOkResponse({ type: [Task] })
  tasks(): Promise<Task[]> {
    return this.tasksService.listActive();
  }

  @Post('time-entries')
  @ApiCreatedResponse({ type: Timesheet })
  logTime(
    @CurrentAgent() agent: AgentPrincipal,
    @Body() dto: AgentTimeEntryDto,
  ): Promise<Timesheet> {
    return this.timesheetsService.logAgentTime(agent.userId, dto);
  }
}
