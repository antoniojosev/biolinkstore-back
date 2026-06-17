import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Respuesta del GET público del theme. Solo expone lo que el cliente
 * necesita para renderizar la tienda. NO expone drafts ni rollback.
 */
export class PublicStoreThemeDto {
  @ApiProperty({ description: 'Key del template publicado o fallback' })
  template: string;

  @ApiProperty({ description: 'Versión del schema del template aplicada al tree' })
  templateVersion: number;

  @ApiPropertyOptional({
    nullable: true,
    type: 'string',
    format: 'date-time',
    description:
      'Timestamp de la última publicación. null si nunca se publicó (fallback).',
  })
  publishedAt: string | null;

  @ApiProperty({
    description:
      'Versión incremental del StoreTheme (no del template). Sube con cada publish.',
  })
  version: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Árbol de secciones publicado (post-migración lazy si aplica).',
  })
  tree: unknown;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Tokens de diseño (palette, typography, radius, ...).',
  })
  tokens: unknown;
}
