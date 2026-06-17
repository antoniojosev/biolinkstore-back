import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { StoreOwnerGuard } from '@/common/guards/store-owner.guard';
import { GetWhatsappTemplateUseCase } from '../../application/use-cases/whatsapp/get-whatsapp-template.use-case';
import { UpdateWhatsappTemplateUseCase } from '../../application/use-cases/whatsapp/update-whatsapp-template.use-case';
import { PreviewWhatsappTemplateUseCase } from '../../application/use-cases/whatsapp/preview-whatsapp-template.use-case';
import {
  PreviewWhatsappTemplateDto,
  PreviewWhatsappTemplateResponseDto,
  UpdateWhatsappTemplateDto,
  WhatsappTemplateResponseDto,
} from '../../application/dto/whatsapp-template.dto';

@ApiTags('WhatsApp Template')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreOwnerGuard)
@Controller('stores/:storeId/whatsapp-template')
export class WhatsappTemplateController {
  constructor(
    private readonly getUseCase: GetWhatsappTemplateUseCase,
    private readonly updateUseCase: UpdateWhatsappTemplateUseCase,
    private readonly previewUseCase: PreviewWhatsappTemplateUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get WhatsApp message template for store (returns default if none set)' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: WhatsappTemplateResponseDto })
  get(@Param('storeId') storeId: string): Promise<WhatsappTemplateResponseDto> {
    return this.getUseCase.execute(storeId);
  }

  @Put()
  @ApiOperation({ summary: 'Update (or reset with null) WhatsApp template' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: WhatsappTemplateResponseDto })
  update(
    @Param('storeId') storeId: string,
    @Body() dto: UpdateWhatsappTemplateDto,
  ): Promise<WhatsappTemplateResponseDto> {
    return this.updateUseCase.execute(storeId, dto);
  }

  @Post('preview')
  @ApiOperation({ summary: 'Render a WhatsApp template against sample data' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: PreviewWhatsappTemplateResponseDto })
  preview(
    @Param('storeId') storeId: string,
    @Body() dto: PreviewWhatsappTemplateDto,
  ): Promise<PreviewWhatsappTemplateResponseDto> {
    return this.previewUseCase.execute(storeId, dto);
  }
}
