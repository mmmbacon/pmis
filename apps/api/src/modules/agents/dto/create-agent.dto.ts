import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAgentDto {
  @ApiProperty({ example: 'pmis-coding-agent' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Automation agent that records repository maintenance time.' })
  @IsOptional()
  @IsString()
  description?: string;
}
