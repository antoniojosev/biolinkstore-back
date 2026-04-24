import { IsInt, IsOptional, IsIn, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  SERVICE_MODALITIES,
  ServiceModalityDto,
} from './create-product-service-data.dto';

export class UpdateProductServiceDataDto {
  @ApiProperty({ example: 60, required: false, minimum: 0, nullable: true, description: 'Duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  duration?: number | null;

  @ApiProperty({
    example: 'IN_PERSON',
    required: false,
    enum: SERVICE_MODALITIES,
    nullable: true,
  })
  @IsOptional()
  @IsIn(SERVICE_MODALITIES as unknown as string[])
  modality?: ServiceModalityDto | null;

  @ApiProperty({
    example: 'Caracas y valles del Tuy',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  coverage?: string | null;
}
