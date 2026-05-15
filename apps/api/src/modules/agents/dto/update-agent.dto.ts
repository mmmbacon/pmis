import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateAgentDto {
  @ApiPropertyOptional({ example: 'pmis-coding-agent' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Automation agent that records repository maintenance time.' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: true, description: 'Set true to disable the agent.' })
  @IsOptional()
  @IsBoolean()
  disabled?: boolean;
}
