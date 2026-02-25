import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { GetPublicStoreUseCase } from '../../application/use-cases/get-public-store.use-case';
import { GetPublicProductsUseCase } from '../../application/use-cases/get-public-products.use-case';
import { GetPublicProductUseCase } from '../../application/use-cases/get-public-product.use-case';
import { GetPublicCategoriesUseCase } from '../../application/use-cases/get-public-categories.use-case';
import { PublicStoreResponseDto } from '../../application/dto/public-store-response.dto';
import { PublicProductResponseDto } from '../../application/dto/public-product-response.dto';
import { PublicCategoryResponseDto } from '../../application/dto/public-category-response.dto';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { ProductFilterParams } from '@/modules/products/domain/repositories/product.repository.interface';

@ApiTags('Public')
@Public()
@Controller('public')
export class PublicStoreController {
  constructor(
    private readonly getPublicStoreUseCase: GetPublicStoreUseCase,
    private readonly getPublicProductsUseCase: GetPublicProductsUseCase,
    private readonly getPublicProductUseCase: GetPublicProductUseCase,
    private readonly getPublicCategoriesUseCase: GetPublicCategoriesUseCase,
  ) {}

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
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved',
    type: [PublicCategoryResponseDto],
  })
  async getCategories(@Param('slug') slug: string): Promise<PublicCategoryResponseDto[]> {
    return this.getPublicCategoriesUseCase.execute(slug);
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
  @ApiResponse({ status: 200, description: 'Products retrieved' })
  async getProducts(
    @Param('slug') slug: string,
    @Query() filters: ProductFilterParams,
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
}
