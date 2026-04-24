import { IsArray, IsBoolean, IsInt, IsString, Matches, Max, Min, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

const HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class StoreHoursDto {
  @ApiProperty({ example: 'cku...' })
  id: string;

  @ApiProperty({ example: 1, description: '0=Sunday, 6=Saturday' })
  dayOfWeek: number;

  @ApiProperty({ example: '09:00' })
  openTime: string;

  @ApiProperty({ example: '18:00' })
  closeTime: string;

  @ApiProperty({ example: false })
  closed: boolean;
}

export class UpdateStoreHoursEntryDto {
  @ApiProperty({ example: 1, description: '0=Sunday, 6=Saturday' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(HHMM_REGEX, { message: 'openTime must be HH:mm (24h)' })
  openTime: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  @Matches(HHMM_REGEX, { message: 'closeTime must be HH:mm (24h)' })
  closeTime: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  closed: boolean;
}

export class UpdateStoreHoursDto {
  @ApiProperty({ type: [UpdateStoreHoursEntryDto] })
  @IsArray()
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => UpdateStoreHoursEntryDto)
  hours: UpdateStoreHoursEntryDto[];
}
