import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AgentApiKeySummaryDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  id!: string;

  @ApiProperty({ example: 'May rotation key' })
  name!: string;

  @ApiProperty({ example: '7a9f3c2eab914d10' })
  keyPrefix!: string;

  @ApiPropertyOptional({ example: '2026-05-15T22:00:00.000Z', nullable: true })
  lastUsedAt!: Date | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  revokedAt!: Date | null;

  @ApiProperty({ example: '2026-05-15T22:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-05-15T22:00:00.000Z' })
  updatedAt!: Date;
}

export class AgentResponseDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  id!: string;

  @ApiProperty({ example: 'pmis-coding-agent' })
  name!: string;

  @ApiPropertyOptional({ example: 'Automation agent that records repository maintenance time.' })
  description!: string | null;

  @ApiProperty({ example: 'e64fd380-7b1f-4e7f-83f9-316e6f8a40d1' })
  userId!: string;

  @ApiPropertyOptional({ example: '1a407c42-2678-4c5f-9b0f-ee92f53a257c' })
  createdBy!: string | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  disabledAt!: Date | null;

  @ApiProperty({ example: '2026-05-15T22:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-05-15T22:00:00.000Z' })
  updatedAt!: Date;

  @ApiProperty({ type: [AgentApiKeySummaryDto] })
  apiKeys!: AgentApiKeySummaryDto[];
}

export class CreateAgentApiKeyResponseDto {
  @ApiProperty({ type: AgentApiKeySummaryDto })
  key!: AgentApiKeySummaryDto;

  @ApiProperty({
    example: 'pmis_agent_7a9f3c2eab914d10_D5G-DnRuQzLZ9oTS7GRj5AVM0P2doX5p3vLmXJzNb5o',
    description: 'Raw API key. Store it now; it cannot be retrieved again.',
  })
  rawKey!: string;
}

export class AgentPrincipalResponseDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  agentId!: string;

  @ApiProperty({ example: 'e64fd380-7b1f-4e7f-83f9-316e6f8a40d1' })
  userId!: string;

  @ApiProperty({ example: 'pmis-coding-agent' })
  name!: string;

  @ApiProperty({ example: 'cf1f72df-181d-45ea-8837-9a670d96bb2a' })
  keyId!: string;
}
