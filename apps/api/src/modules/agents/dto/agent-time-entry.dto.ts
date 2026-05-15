import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export type AgentTimeEntryMode = 'append' | 'replace';

export class AgentTimeEntryDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  @IsUUID()
  taskId!: string;

  @ApiProperty({ example: '2026-05-15' })
  @IsISO8601({ strict: true })
  workDate!: string;

  @ApiProperty({ example: 1.25, minimum: 0.25, maximum: 24 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.25)
  @Max(24)
  hours!: number;

  @ApiPropertyOptional({ example: 'Implemented API key guard for agent time logging' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ enum: ['append', 'replace'], default: 'append' })
  @IsOptional()
  @IsIn(['append', 'replace'])
  mode?: AgentTimeEntryMode;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  submitWeek?: boolean;
}
