import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { AuthenticatedUser } from '../../common/authenticated-user';
import { Role } from '../users/role.entity';
import { User } from '../users/user.entity';
import { AgentApiKey } from './agent-api-key.entity';
import { AgentPrincipal } from './agent-principal';
import { Agent } from './agent.entity';
import { CreateAgentApiKeyDto } from './dto/create-agent-api-key.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import {
  AgentApiKeySummaryDto,
  AgentResponseDto,
  CreateAgentApiKeyResponseDto,
} from './dto/agent-response.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

const keyPrefixLengthBytes = 8;
const keySecretLengthBytes = 32;

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent) private readonly agents: Repository<Agent>,
    @InjectRepository(AgentApiKey) private readonly apiKeys: Repository<AgentApiKey>,
    private readonly dataSource: DataSource,
  ) {}

  async list(): Promise<AgentResponseDto[]> {
    const agents = await this.agents.find({
      relations: { apiKeys: true },
      order: { createdAt: 'DESC' },
    });
    return agents.map((agent) => this.toAgentResponse(agent));
  }

  async create(dto: CreateAgentDto, actor: AuthenticatedUser): Promise<AgentResponseDto> {
    const agent = await this.dataSource.transaction(async (manager) => {
      const roles = manager.getRepository(Role);
      const users = manager.getRepository(User);
      const agents = manager.getRepository(Agent);
      const employeeRole = await roles.findOneByOrFail({ name: 'employee' });
      const agentId = randomUUID();
      const passwordHash = await bcrypt.hash(randomBytes(48).toString('base64url'), 12);
      const user = await users.save(
        users.create({
          email: `agent+${agentId}@agents.local`,
          name: dto.name.trim(),
          passwordHash,
          roles: [employeeRole],
        }),
      );

      return agents.save(
        agents.create({
          id: agentId,
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          userId: user.id,
          createdBy: actor.id,
          disabledAt: null,
        }),
      );
    });

    return this.findResponse(agent.id);
  }

  async update(id: string, dto: UpdateAgentDto): Promise<AgentResponseDto> {
    await this.dataSource.transaction(async (manager) => {
      const agents = manager.getRepository(Agent);
      const agent = await agents.findOneBy({ id });
      if (!agent) {
        throw new NotFoundException('Agent not found');
      }

      if (dto.name !== undefined) {
        agent.name = dto.name.trim();
        await manager.getRepository(User).update(agent.userId, { name: agent.name });
      }
      if (dto.description !== undefined) {
        agent.description = dto.description?.trim() || null;
      }
      if (dto.disabled !== undefined) {
        agent.disabledAt = dto.disabled ? (agent.disabledAt ?? new Date()) : null;
      }

      await agents.save(agent);
    });

    return this.findResponse(id);
  }

  async createApiKey(
    agentId: string,
    dto: CreateAgentApiKeyDto,
  ): Promise<CreateAgentApiKeyResponseDto> {
    const agent = await this.agents.findOneBy({ id: agentId });
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }
    if (agent.disabledAt) {
      throw new BadRequestException('Disabled agents cannot receive new API keys');
    }

    const keyPrefix = randomBytes(keyPrefixLengthBytes).toString('hex');
    const secret = randomBytes(keySecretLengthBytes).toString('base64url');
    const rawKey = `pmis_agent_${keyPrefix}_${secret}`;
    const keyHash = await bcrypt.hash(rawKey, 12);
    const key = await this.apiKeys.save(
      this.apiKeys.create({
        agentId,
        name: dto.name.trim(),
        keyPrefix,
        keyHash,
        lastUsedAt: null,
        revokedAt: null,
      }),
    );

    return { key: this.toKeySummary(key), rawKey };
  }

  async revokeApiKey(agentId: string, keyId: string): Promise<AgentApiKeySummaryDto> {
    const key = await this.apiKeys.findOneBy({ id: keyId, agentId });
    if (!key) {
      throw new NotFoundException('Agent API key not found');
    }
    key.revokedAt = key.revokedAt ?? new Date();
    return this.toKeySummary(await this.apiKeys.save(key));
  }

  async validateApiKey(rawKey: string): Promise<AgentPrincipal> {
    const keyPrefix = this.parseKeyPrefix(rawKey);
    const key = await this.apiKeys.findOne({
      where: { keyPrefix },
      relations: { agent: true },
    });
    if (!key || key.revokedAt || key.agent.disabledAt) {
      throw new UnauthorizedException('Invalid agent API key');
    }

    const valid = await bcrypt.compare(rawKey, key.keyHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid agent API key');
    }

    key.lastUsedAt = new Date();
    await this.apiKeys.save(key);
    return {
      agentId: key.agentId,
      userId: key.agent.userId,
      name: key.agent.name,
      keyId: key.id,
    };
  }

  private parseKeyPrefix(rawKey: string): string {
    const match = /^pmis_agent_([0-9a-f]{16})_[A-Za-z0-9_-]{32,}$/.exec(rawKey);
    if (!match) {
      throw new UnauthorizedException('Invalid agent API key');
    }
    return match[1]!;
  }

  private async findResponse(id: string): Promise<AgentResponseDto> {
    const agent = await this.agents.findOne({ where: { id }, relations: { apiKeys: true } });
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }
    return this.toAgentResponse(agent);
  }

  private toAgentResponse(agent: Agent): AgentResponseDto {
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      userId: agent.userId,
      createdBy: agent.createdBy,
      disabledAt: agent.disabledAt,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      apiKeys: [...(agent.apiKeys ?? [])]
        .sort((left, right) => right.createdAt.valueOf() - left.createdAt.valueOf())
        .map((key) => this.toKeySummary(key)),
    };
  }

  private toKeySummary(key: AgentApiKey): AgentApiKeySummaryDto {
    return {
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      lastUsedAt: key.lastUsedAt,
      revokedAt: key.revokedAt,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
    };
  }
}
