import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/**
 * Query params para GET /stores/:storeId/theme/preview.
 *
 * `template`: opcional. Si se pasa, fuerza el preview de ese template
 * (validamos que esté en el catálogo y plan-gating). Si no, se usa
 * `theme.activeTemplate`.
 *
 * Patrón: keys del catálogo son slugs simples ([a-z0-9-]). Aplicamos un
 * regex defensivo para evitar que se cuelen caracteres extraños en queries
 * antes de tocar la DB.
 */
export class StorePreviewQueryDto {
  @ApiPropertyOptional({
    description: 'Key del template a previewar. Default: theme.activeTemplate.',
    example: 'atelier',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'template must be a lowercase slug ([a-z0-9-])',
  })
  template?: string;
}
