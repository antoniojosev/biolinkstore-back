import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { StoreOwnerGuard } from '@/common/guards/store-owner.guard';
import { CreateSocialLinkUseCase } from '../../application/use-cases/social-links/create-social-link.use-case';
import { ListSocialLinksUseCase } from '../../application/use-cases/social-links/list-social-links.use-case';
import { UpdateSocialLinkUseCase } from '../../application/use-cases/social-links/update-social-link.use-case';
import { DeleteSocialLinkUseCase } from '../../application/use-cases/social-links/delete-social-link.use-case';
import { ReorderSocialLinksUseCase } from '../../application/use-cases/social-links/reorder-social-links.use-case';
import {
  CreateStoreSocialLinkDto,
  ReorderStoreSocialLinksDto,
  StoreSocialLinkResponseDto,
  UpdateStoreSocialLinkDto,
} from '../../application/dto/store-social-link.dto';

@ApiTags('Stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreOwnerGuard)
@Controller('stores/:storeId/socials')
export class StoreSocialLinksController {
  constructor(
    private readonly createSocialLink: CreateSocialLinkUseCase,
    private readonly listSocialLinks: ListSocialLinksUseCase,
    private readonly updateSocialLink: UpdateSocialLinkUseCase,
    private readonly deleteSocialLink: DeleteSocialLinkUseCase,
    private readonly reorderSocialLinks: ReorderSocialLinksUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List social links for a store (lazy-migrates legacy JSON on first read)' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: [StoreSocialLinkResponseDto] })
  async list(@Param('storeId') storeId: string): Promise<StoreSocialLinkResponseDto[]> {
    return this.listSocialLinks.execute(storeId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a social link for a store' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 201, type: StoreSocialLinkResponseDto })
  async create(
    @Param('storeId') storeId: string,
    @Body() dto: CreateStoreSocialLinkDto,
  ): Promise<StoreSocialLinkResponseDto> {
    return this.createSocialLink.execute(storeId, dto);
  }

  @Patch(':socialId')
  @ApiOperation({ summary: 'Update a social link' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiParam({ name: 'socialId', type: 'string' })
  @ApiResponse({ status: 200, type: StoreSocialLinkResponseDto })
  async update(
    @Param('storeId') storeId: string,
    @Param('socialId') socialId: string,
    @Body() dto: UpdateStoreSocialLinkDto,
  ): Promise<StoreSocialLinkResponseDto> {
    return this.updateSocialLink.execute(storeId, socialId, dto);
  }

  @Delete(':socialId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a social link' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiParam({ name: 'socialId', type: 'string' })
  @ApiResponse({ status: 204 })
  async remove(
    @Param('storeId') storeId: string,
    @Param('socialId') socialId: string,
  ): Promise<void> {
    return this.deleteSocialLink.execute(storeId, socialId);
  }

  @Post('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Bulk reorder social links by id → sortOrder pairs' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 204, description: 'Reordered' })
  async reorder(
    @Param('storeId') storeId: string,
    @Body() dto: ReorderStoreSocialLinksDto,
  ): Promise<void> {
    return this.reorderSocialLinks.execute(storeId, dto);
  }
}
