import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpsertTimesheetEntryDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsUUID()
  taskId!: string;

  @IsISO8601({ strict: true })
  workDate!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.25)
  @Max(24)
  hours!: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpsertTimesheetDto {
  @IsISO8601({ strict: true })
  periodStart!: string;

  @IsISO8601({ strict: true })
  periodEnd!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpsertTimesheetEntryDto)
  entries!: UpsertTimesheetEntryDto[];
}
