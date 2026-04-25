import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { StoreOwnerGuard } from '@/common/guards/store-owner.guard';
import { GetStoreThemeUseCase } from '../../application/use-cases/get-store-theme.use-case';
import { UpdateDraftTokensUseCase } from '../../application/use-cases/update-draft-tokens.use-case';
import { UpdateDraftSectionsUseCase } from '../../application/use-cases/update-draft-sections.use-case';
import { SwitchTemplateUseCase } from '../../application/use-cases/switch-template.use-case';
import { ResetDraftUseCase } from '../../application/use-cases/reset-draft.use-case';
import { PublishThemeUseCase } from '../../application/use-cases/publish-theme.use-case';
import { RollbackThemeUseCase } from '../../application/use-cases/rollback-theme.use-case';
import { StoreThemeResponseDto } from '../../application/dto/store-theme-response.dto';
import { UpdateDraftTokensDto } from '../../application/dto/update-draft-tokens.dto';
import { UpdateDraftSectionsDto } from '../../application/dto/update-draft-sections.dto';
import { SwitchTemplateDto } from '../../application/dto/switch-template.dto';

@ApiTags('Page Builder — Store Theme (edit)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreOwnerGuard)
@Controller('stores/:storeId/theme')
export class StoreThemesController {
  constructor(
    private readonly getStoreTheme: GetStoreThemeUseCase,
    private readonly updateDraftTokens: UpdateDraftTokensUseCase,
    private readonly updateDraftSections: UpdateDraftSectionsUseCase,
    private readonly switchTemplate: SwitchTemplateUseCase,
    private readonly resetDraft: ResetDraftUseCase,
    private readonly publishTheme: PublishThemeUseCase,
    private readonly rollbackTheme: RollbackThemeUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Estado completo del theme del store (lazy create)',
    description:
      'Si el StoreTheme no existe, lo crea con activeTemplate="vitrina" y draft por defecto.',
  })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: StoreThemeResponseDto })
  async get(@Param('storeId') storeId: string): Promise<StoreThemeResponseDto> {
    return this.getStoreTheme.execute(storeId);
  }

  @Patch('draft/tokens')
  @ApiOperation({
    summary: 'Actualizar tokens del draft activo (deep merge parcial)',
    description:
      'Acepta partial: palette, typography, radius, spacing, buttonStyle. Hace merge profundo con tokens actuales del draft activo. Props desconocidas en palette se ignoran silenciosamente.',
  })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: StoreThemeResponseDto })
  async patchTokens(
    @Param('storeId') storeId: string,
    @Body() dto: UpdateDraftTokensDto,
  ): Promise<StoreThemeResponseDto> {
    return this.updateDraftTokens.execute(storeId, dto.tokens);
  }

  @Patch('draft/sections')
  @ApiOperation({
    summary: 'Reemplazar el árbol de secciones del draft activo',
    description:
      'Replace completo. Validado contra sectionSchema del template activo. Secciones con type no declarado se ignoran (lenient). Keys duplicadas o tipos inválidos en props => 400.',
  })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: StoreThemeResponseDto })
  @ApiResponse({ status: 400, description: 'Validación de secciones falló' })
  async patchSections(
    @Param('storeId') storeId: string,
    @Body() dto: UpdateDraftSectionsDto,
  ): Promise<StoreThemeResponseDto> {
    return this.updateDraftSections.execute(storeId, dto);
  }

  @Post('switch-template')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cambiar template activo (multi-draft FIFO max 3)',
    description:
      'Si el draft del template ya existe, sólo cambia activeTemplate. Si no, lo crea con defaults; si hay 3 drafts no-published purga el más antiguo. Plan-gated.',
  })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: StoreThemeResponseDto })
  @ApiResponse({ status: 403, description: 'Plan insuficiente para template' })
  @ApiResponse({ status: 404, description: 'Template no existe o inactivo' })
  async switch(
    @Param('storeId') storeId: string,
    @Body() dto: SwitchTemplateDto,
  ): Promise<StoreThemeResponseDto> {
    return this.switchTemplate.execute(storeId, dto.templateKey);
  }

  @Post('reset-draft')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resetear draft activo (a published si aplica, sino a defaults)',
    description:
      'Si publishedTemplate === activeTemplate y hay published, restaura desde published. Si no, restaura desde defaults del template.',
  })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: StoreThemeResponseDto })
  async reset(@Param('storeId') storeId: string): Promise<StoreThemeResponseDto> {
    return this.resetDraft.execute(storeId);
  }

  @Post('publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Publicar el draft activo (snapshot anterior → rollback)',
    description:
      'Promueve drafts[activeTemplate] a published. El published actual (si existe) se mueve a rollback. version++. publishedAt=now. El draft permanece editable.',
  })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: StoreThemeResponseDto })
  @ApiResponse({ status: 400, description: 'No hay draft para el template activo' })
  async publish(@Param('storeId') storeId: string): Promise<StoreThemeResponseDto> {
    return this.publishTheme.execute(storeId);
  }

  @Post('rollback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Volver al snapshot anterior (swap published ↔ rollback)',
    description:
      'Swap atómico published ↔ rollback. NO toca drafts ni activeTemplate. NO incrementa version. publishedAt=now.',
  })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: StoreThemeResponseDto })
  @ApiResponse({ status: 400, description: 'No hay rollback disponible' })
  async rollback(@Param('storeId') storeId: string): Promise<StoreThemeResponseDto> {
    return this.rollbackTheme.execute(storeId);
  }
}
