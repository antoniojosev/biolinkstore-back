import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response del preview con datos reales: GET /stores/:storeId/theme/preview.
 *
 * `mode`:
 *   - "live"           → productos reales se usaron tal cual.
 *   - "demo-fallback"  → el store no tiene productos visibles; caímos a la
 *                        demoData del template (UI puede mostrar "tu tienda
 *                        aún no tiene productos").
 *
 * `isDraft`:
 *   - true   → tree+tokens vienen del draft persistido para ese template.
 *   - false  → tree+tokens construidos a partir de defaults del catálogo
 *              porque el draft aún no existe (no se persistió nada).
 *
 * `isActiveTemplate`:
 *   - true si el template previewado coincide con `theme.activeTemplate`.
 *   - false si se pidió por query un template distinto.
 */
export class StorePreviewResponseDto {
  @ApiProperty({ enum: ['live', 'demo-fallback'] })
  mode: 'live' | 'demo-fallback';

  @ApiProperty()
  template: string;

  @ApiProperty()
  templateVersion: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description:
      'Snapshot ligero del store (id, slug, name, logo, banner, phone, address, email, socials).',
  })
  store: unknown;

  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    description:
      'Productos visibles (limit 20). Si no hay productos, fallback a demoData.products.',
  })
  products: unknown[];

  @ApiProperty({
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    description:
      'Categorías visibles. Si no hay, fallback a demoData.categories.',
  })
  categories: unknown[];

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Tree del draft (o defaults si no existe). Migrado lazy.',
  })
  tree: unknown;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Tokens del draft (o defaults si no existe).',
  })
  tokens: unknown;

  @ApiProperty({
    description:
      'true si tree+tokens vienen del draft persistido; false si son defaults sintetizados.',
  })
  isDraft: boolean;

  @ApiProperty({
    description: 'true si template === theme.activeTemplate.',
  })
  isActiveTemplate: boolean;

  @ApiPropertyOptional({
    description:
      'Si el activeTemplate del theme ya no existe en el catálogo y se cayó a vitrina, este campo expone el template originalmente activo (informativo).',
  })
  fallbackFromInvalidActive?: string;
}
