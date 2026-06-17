import { Controller, Get, Param, Query, Res, HttpStatus, NotFoundException, Headers, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '@/common/decorators/public.decorator';
import { GetPublicStoreUseCase } from '../../application/use-cases/get-public-store.use-case';
import { GetPublicProductsUseCase } from '../../application/use-cases/get-public-products.use-case';
import { GetPublicProductUseCase } from '../../application/use-cases/get-public-product.use-case';
import { GetPublicCategoriesUseCase } from '../../application/use-cases/get-public-categories.use-case';
import { GenerateStoreQrUseCase } from '../../application/use-cases/generate-store-qr.use-case';
import { CheckSlugExistsUseCase } from '../../application/use-cases/check-slug-exists.use-case';
import { GenerateStoreOgUseCase } from '../../application/use-cases/generate-store-og.use-case';
import { GetPublicRatesUseCase } from '../../application/use-cases/get-public-rates.use-case';
import { GetStoreVisibleRatesUseCase } from '../../application/use-cases/get-store-visible-rates.use-case';
import { PublicStoreResponseDto } from '../../application/dto/public-store-response.dto';
import { PublicProductResponseDto } from '../../application/dto/public-product-response.dto';
import { PublicCategoryResponseDto } from '../../application/dto/public-category-response.dto';
import { PublicProductFiltersDto } from '../../application/dto/public-product-filters.dto';
import {
  PublicRateResponseDto,
  StoreVisibleRatesResponseDto,
} from '../../application/dto/public-rate-response.dto';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';

@ApiTags('Public')
@Public()
@Controller('public')
export class PublicStoreController {
  constructor(
    private readonly getPublicStoreUseCase: GetPublicStoreUseCase,
    private readonly getPublicProductsUseCase: GetPublicProductsUseCase,
    private readonly getPublicProductUseCase: GetPublicProductUseCase,
    private readonly getPublicCategoriesUseCase: GetPublicCategoriesUseCase,
    private readonly generateStoreQrUseCase: GenerateStoreQrUseCase,
    private readonly checkSlugExistsUseCase: CheckSlugExistsUseCase,
    private readonly generateStoreOgUseCase: GenerateStoreOgUseCase,
    private readonly getPublicRatesUseCase: GetPublicRatesUseCase,
    private readonly getStoreVisibleRatesUseCase: GetStoreVisibleRatesUseCase,
  ) {}

  @Get('rates')
  @ApiOperation({ summary: 'Get all active official rates with current value' })
  @ApiResponse({ status: 200, type: [PublicRateResponseDto] })
  async getRates(): Promise<PublicRateResponseDto[]> {
    return this.getPublicRatesUseCase.execute();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get public store by slug (no auth required)' })
  @ApiParam({ name: 'slug', type: 'string', example: 'mi-tienda' })
  @ApiResponse({ status: 200, description: 'Store found', type: PublicStoreResponseDto })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getStore(@Param('slug') slug: string): Promise<PublicStoreResponseDto> {
    return this.getPublicStoreUseCase.execute(slug);
  }

  @Get(':slug/categories')
  @ApiOperation({ summary: 'Get public categories for a store (no auth required)' })
  @ApiParam({ name: 'slug', type: 'string', example: 'mi-tienda' })
  @ApiQuery({
    name: 'tree',
    required: false,
    type: Boolean,
    description: 'If true, returns nested tree (children populated). Default: flat list.',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved',
    type: [PublicCategoryResponseDto],
  })
  async getCategories(
    @Param('slug') slug: string,
    @Query('tree') tree?: string,
  ): Promise<PublicCategoryResponseDto[]> {
    const asTree = tree === 'true' || tree === '1';
    return this.getPublicCategoriesUseCase.execute(slug, asTree);
  }

  @Get(':slug/products')
  @ApiOperation({ summary: 'Get public products for a store (no auth required)' })
  @ApiParam({ name: 'slug', type: 'string', example: 'mi-tienda' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean })
  @ApiQuery({ name: 'isOnSale', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'bedrooms', required: false, type: Number })
  @ApiQuery({ name: 'bathrooms', required: false, type: Number })
  @ApiQuery({ name: 'area_min', required: false, type: Number })
  @ApiQuery({ name: 'area_max', required: false, type: Number })
  @ApiQuery({ name: 'listingType', required: false, enum: ['SALE', 'RENT'] })
  @ApiQuery({ name: 'modality', required: false, enum: ['IN_PERSON', 'ONLINE', 'HYBRID'] })
  @ApiQuery({ name: 'duration_min', required: false, type: Number })
  @ApiQuery({ name: 'duration_max', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Products retrieved' })
  async getProducts(
    @Param('slug') slug: string,
    @Query() filters: PublicProductFiltersDto,
  ): Promise<PaginatedResult<PublicProductResponseDto>> {
    return this.getPublicProductsUseCase.execute(slug, filters);
  }

  @Get(':slug/products/:productSlug')
  @ApiOperation({ summary: 'Get public product details (no auth required)' })
  @ApiParam({ name: 'slug', type: 'string', example: 'mi-tienda' })
  @ApiParam({ name: 'productSlug', type: 'string', example: 'camiseta-basica' })
  @ApiResponse({ status: 200, description: 'Product found', type: PublicProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(
    @Param('slug') slug: string,
    @Param('productSlug') productSlug: string,
  ): Promise<PublicProductResponseDto> {
    return this.getPublicProductUseCase.execute(slug, productSlug);
  }

  @Get(':slug/exists')
  @ApiOperation({ summary: 'Check if a slug exists; logs miss when not found' })
  @ApiParam({ name: 'slug', type: 'string' })
  @ApiResponse({ status: 200, description: 'Slug exists' })
  @ApiResponse({ status: 404, description: 'Slug not found, includes suggestions' })
  async checkExists(
    @Param('slug') slug: string,
    @Res() res: Response,
    @Ip() ip: string,
    @Headers('x-forwarded-for') forwardedFor?: string,
    @Headers('referer') referer?: string,
  ): Promise<void> {
    const clientIp = forwardedFor?.split(',')[0]?.trim() || ip;
    const result = await this.checkSlugExistsUseCase.execute(slug, {
      ip: clientIp,
      referrer: referer ?? null,
    });

    if (result.exists) {
      res.status(HttpStatus.OK).json({ exists: true });
      return;
    }

    res.status(HttpStatus.NOT_FOUND).json({ exists: false, suggested: result.suggested ?? [] });
  }

  @Get(':slug/qr.png')
  @ApiOperation({ summary: 'Get store QR code as PNG (512x512, target = public store URL)' })
  @ApiParam({ name: 'slug', type: 'string', example: 'mi-tienda' })
  @ApiResponse({ status: 200, description: 'QR PNG image stream', content: { 'image/png': {} } })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getStoreQr(@Param('slug') slug: string, @Res() res: Response): Promise<void> {
    const { buffer } = await this.generateStoreQrUseCase.execute(slug);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end(buffer);
  }

  @Get(':slug/og.png')
  @ApiOperation({ summary: 'Dynamic OG image (1200x630) for store sharing' })
  @ApiParam({ name: 'slug', type: 'string' })
  @ApiResponse({ status: 200, description: 'OG PNG image', content: { 'image/png': {} } })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getStoreOg(@Param('slug') slug: string, @Res() res: Response): Promise<void> {
    const { buffer, cached } = await this.generateStoreOgUseCase.execute(slug);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('X-OG-Cache', cached ? 'HIT' : 'MISS');
    res.end(buffer);
  }

  @Get(':slug/rates')
  @ApiOperation({
    summary: 'Get rates visible to buyer for a store (filtered by plan + store config)',
  })
  @ApiParam({ name: 'slug', type: 'string', example: 'mi-tienda' })
  @ApiResponse({ status: 200, type: StoreVisibleRatesResponseDto })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getStoreRates(@Param('slug') slug: string): Promise<StoreVisibleRatesResponseDto> {
    return this.getStoreVisibleRatesUseCase.execute(slug);
  }
}
