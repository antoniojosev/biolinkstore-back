import { Controller, Get, Header, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { GetPublicStoreThemeUseCase } from '../../application/use-cases/get-public-store-theme.use-case';
import { PublicStoreThemeDto } from '../../application/dto/public-store-theme-response.dto';

/**
 * Endpoint público para que el frontend de la tienda renderice con el tema
 * publicado. Sin auth, sin plan-gating (es lectura pública).
 *
 * Cache:
 *   - `Cache-Control: public, max-age=60` aplicado siempre por simplicidad.
 *     Suficiente para CDN/browser sin requerir invalidación inmediata tras
 *     publish; el editor usa endpoints autenticados que devuelven el draft.
 */
@ApiTags('Public — Store Theme')
@Public()
@Controller('public')
export class PublicStoreThemeController {
  constructor(
    private readonly getPublicStoreTheme: GetPublicStoreThemeUseCase,
  ) {}

  @Get(':slug/theme')
  @Header('Cache-Control', 'public, max-age=60')
  @ApiOperation({
    summary: 'Theme publicado de la tienda por slug (público, sin auth)',
    description:
      'Devuelve el published actual con migración lazy del tree al templateVersion del catálogo. Si la tienda nunca publicó, devuelve un fallback construido sobre vitrina + defaults (no escribe en DB).',
  })
  @ApiParam({ name: 'slug', type: 'string', example: 'mi-tienda' })
  @ApiResponse({ status: 200, type: PublicStoreThemeDto })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getTheme(@Param('slug') slug: string): Promise<PublicStoreThemeDto> {
    return this.getPublicStoreTheme.execute(slug);
  }
}
