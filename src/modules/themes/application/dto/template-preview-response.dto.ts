import { ApiProperty } from '@nestjs/swagger';
import { TemplateNiche } from '@prisma/client';

/**
 * Response del preview público de catálogo: GET /public/templates/:key/preview.
 *
 * Combina la metadata del template con la demoData seedeada y un tree default
 * + tokens default ya construidos. El editor lo consume cuando el usuario aún
 * no tiene productos o quiere ver un template "limpio" antes de aplicarlo.
 */
export class TemplatePreviewResponseDto {
  @ApiProperty({ description: 'Key del template' })
  template: string;

  @ApiProperty({ description: 'Versión del schema del template' })
  templateVersion: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: TemplateNiche })
  niche: TemplateNiche;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description:
      'Demo data del template (store/products/categories fake) — diseñada por el catálogo.',
  })
  demoData: unknown;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Tree default (defaultTreeFor) listo para renderizar.',
  })
  tree: unknown;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Tokens default del template (palette, typography, etc.).',
  })
  tokens: unknown;
}
