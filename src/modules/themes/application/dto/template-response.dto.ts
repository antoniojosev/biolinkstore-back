import { ApiProperty } from '@nestjs/swagger';
import { Plan, TemplateNiche } from '@prisma/client';

export class TemplateListItemDto {
  @ApiProperty()
  key: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: TemplateNiche })
  niche: TemplateNiche;

  @ApiProperty({ enum: Plan })
  planRequired: Plan;

  @ApiProperty({ required: false, nullable: true })
  previewImage: string | null;

  @ApiProperty()
  version: number;

  @ApiProperty()
  sortOrder: number;
}

export class TemplateDetailDto {
  @ApiProperty()
  key: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: TemplateNiche })
  niche: TemplateNiche;

  @ApiProperty({ enum: Plan })
  planRequired: Plan;

  @ApiProperty({ required: false, nullable: true })
  previewImage: string | null;

  @ApiProperty({
    description:
      'Esquema de secciones disponibles + orden por defecto del template.',
    type: 'object',
    additionalProperties: true,
  })
  sectionSchema: unknown;

  @ApiProperty({
    description:
      'Tokens de diseño por defecto (palette, typography, radius, spacing, buttonStyle).',
    type: 'object',
    additionalProperties: true,
  })
  defaultTokens: unknown;

  @ApiProperty({
    required: false,
    nullable: true,
    description:
      'Recetas alternativas curadas por el diseñador: Array<{ key, name, description?, tokens (set completo), sectionOverrides? }>. La receta "Original" no viaja acá — el frontend la deriva de defaultTokens.',
    type: 'array',
    items: { type: 'object', additionalProperties: true },
  })
  stylePresets: unknown | null;

  @ApiProperty()
  version: number;
}
