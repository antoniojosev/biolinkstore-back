import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Plan, TemplateNiche } from '@prisma/client';
import { Public } from '@/common/decorators/public.decorator';
import { ListTemplatesUseCase } from '../../application/use-cases/list-templates.use-case';
import { GetTemplateUseCase } from '../../application/use-cases/get-template.use-case';
import { ListTemplatesQueryDto } from '../../application/dto/list-templates-query.dto';
import {
  TemplateDetailDto,
  TemplateListItemDto,
} from '../../application/dto/template-response.dto';

@ApiTags('Page Builder — Templates')
@Public()
@Controller('templates')
export class TemplatesController {
  constructor(
    private readonly listTemplatesUseCase: ListTemplatesUseCase,
    private readonly getTemplateUseCase: GetTemplateUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar templates activos del catálogo (público, sin auth)',
    description:
      'Devuelve la lista activa ordenada por sortOrder. Acepta filtros opcionales por nicho y plan. Query params no declarados se ignoran silenciosamente.',
  })
  @ApiQuery({ name: 'niche', required: false, enum: TemplateNiche })
  @ApiQuery({
    name: 'plan',
    required: false,
    enum: Plan,
    description: 'Filtra por planRequired <= plan (FREE < PRO < BUSINESS).',
  })
  @ApiResponse({ status: 200, type: [TemplateListItemDto] })
  // Override local del pipe global: ignora query params desconocidos en lugar de
  // rechazar con 400. La global usa forbidNonWhitelisted=true; aquí lo bajamos.
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async listTemplates(@Query() query: ListTemplatesQueryDto): Promise<TemplateListItemDto[]> {
    return this.listTemplatesUseCase.execute({
      niche: query.niche,
      plan: query.plan,
    });
  }

  @Get(':key')
  @ApiOperation({ summary: 'Obtener metadata de un template por key (público, sin auth)' })
  @ApiParam({ name: 'key', type: 'string', example: 'vitrina' })
  @ApiResponse({ status: 200, type: TemplateDetailDto })
  @ApiResponse({ status: 404, description: 'Template no encontrado o inactivo' })
  async getTemplate(@Param('key') key: string): Promise<TemplateDetailDto> {
    return this.getTemplateUseCase.execute(key);
  }
}
