import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../../common/authenticated-user';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { AgentsService } from './agents.service';
import { CreateAgentApiKeyDto } from './dto/create-agent-api-key.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import {
  AgentApiKeySummaryDto,
  AgentResponseDto,
  CreateAgentApiKeyResponseDto,
} from './dto/agent-response.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@ApiTags('agents')
@ApiBearerAuth('bearer-jwt')
@Controller('agents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  @ApiOkResponse({ type: [AgentResponseDto] })
  list(): Promise<AgentResponseDto[]> {
    return this.agentsService.list();
  }

  @Post()
  @ApiCreatedResponse({ type: AgentResponseDto })
  create(
    @Body() dto: CreateAgentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AgentResponseDto> {
    return this.agentsService.create(dto, user);
  }

  @Patch(':id')
  @ApiOkResponse({ type: AgentResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateAgentDto): Promise<AgentResponseDto> {
    return this.agentsService.update(id, dto);
  }

  @Post(':id/api-keys')
  @ApiCreatedResponse({ type: CreateAgentApiKeyResponseDto })
  createApiKey(
    @Param('id') id: string,
    @Body() dto: CreateAgentApiKeyDto,
  ): Promise<CreateAgentApiKeyResponseDto> {
    return this.agentsService.createApiKey(id, dto);
  }

  @Post(':id/api-keys/:keyId/revoke')
  @ApiCreatedResponse({ type: AgentApiKeySummaryDto })
  revokeApiKey(
    @Param('id') id: string,
    @Param('keyId') keyId: string,
  ): Promise<AgentApiKeySummaryDto> {
    return this.agentsService.revokeApiKey(id, keyId);
  }
}
