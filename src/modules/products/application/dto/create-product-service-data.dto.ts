import { IsInt, IsOptional, IsIn, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const SERVICE_MODALITIES = ['IN_PERSON', 'ONLINE', 'HYBRID'] as const;
export type ServiceModalityDto = (typeof SERVICE_MODALITIES)[number];

export class CreateProductServiceDataDto {
  @ApiProperty({ example: 60, required: false, minimum: 0, description: 'Duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiProperty({
    example: 'IN_PERSON',
    required: false,
    enum: SERVICE_MODALITIES,
  })
  @IsOptional()
  @IsIn(SERVICE_MODALITIES as unknown as string[])
  modality?: ServiceModalityDto;

  @ApiProperty({
    example: 'Caracas y valles del Tuy',
    required: false,
    description: 'Free text: service coverage area',
  })
  @IsOptional()
  @IsString()
  coverage?: string;
}
