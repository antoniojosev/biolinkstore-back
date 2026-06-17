import { Controller, Get, Header, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { GetTemplatePreviewUseCase } from '../../application/use-cases/get-template-preview.use-case';
import { TemplatePreviewResponseDto } from '../../application/dto/template-preview-response.dto';

/**
 * GET /public/templates/:key/preview — preview público con demo data.
 *
 * Decisión BE-120d: nuevo controller dedicado en lugar de extender
 * `TemplatesController` (que ya vive en `/templates/:key`). Razones:
 *   - Mantenemos naming consistente con el otro endpoint público de la fase
 *     (`/public/:slug/theme` → PublicStoreThemeController).
 *   - El cliente claramente ve "rutas públicas" agrupadas bajo `/public/*`.
 *   - Cache/CDN policy puede divergir entre catálogo (`/templates`) y preview
 *     (`/public/templates`) sin colisión de prefijos.
 *
 * Cache: 5 min (templates no cambian seguido). Suficiente para el editor
 * que recarga el preview al cambiar de template; CDN no impacta UX.
 */
@ApiTags('Public — Template Preview')
@Public()
@Controller('public/templates')
export class PublicTemplatePreviewController {
  constructor(
    private readonly getTemplatePreview: GetTemplatePreviewUseCase,
  ) {}

  @Get(':key/preview')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({
    summary: 'Preview público de un template del catálogo (demo data, sin auth)',
    description:
      'Devuelve metadata del template + demoData seedeada + tree default + tokens default. Útil para mostrar el template "limpio" antes de aplicarlo a una tienda. 404 si el template no existe o está inactivo.',
  })
  @ApiParam({ name: 'key', type: 'string', example: 'atelier' })
  @ApiResponse({ status: 200, type: TemplatePreviewResponseDto })
  @ApiResponse({ status: 404, description: 'Template no encontrado o inactivo' })
  async getPreview(@Param('key') key: string): Promise<TemplatePreviewResponseDto> {
    return this.getTemplatePreview.execute(key);
  }
}
