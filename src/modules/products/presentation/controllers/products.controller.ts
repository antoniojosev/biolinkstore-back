import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { StoreOwnerGuard } from '@/common/guards/store-owner.guard';
import { CreateProductUseCase } from '../../application/use-cases/create-product.use-case';
import { UpdateProductUseCase } from '../../application/use-cases/update-product.use-case';
import { DeleteProductUseCase } from '../../application/use-cases/delete-product.use-case';
import { GetProductUseCase } from '../../application/use-cases/get-product.use-case';
import { ListProductsUseCase } from '../../application/use-cases/list-products.use-case';
import { DuplicateProductUseCase } from '../../application/use-cases/duplicate-product.use-case';
import { CreateProductDto } from '../../application/dto/create-product.dto';
import { UpdateProductDto } from '../../application/dto/update-product.dto';
import { ProductResponseDto } from '../../application/dto/product-response.dto';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { ProductFilterParams } from '../../domain/repositories/product.repository.interface';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreOwnerGuard)
@Controller('stores/:storeId/products')
export class ProductsController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    private readonly getProductUseCase: GetProductUseCase,
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly duplicateProductUseCase: DuplicateProductUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 201, description: 'Product created', type: ProductResponseDto })
  async createProduct(
    @Param('storeId') storeId: string,
    @Body() dto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return this.createProductUseCase.execute(storeId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all products for a store' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'isVisible', required: false, type: Boolean })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean })
  @ApiQuery({ name: 'isOnSale', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Products list retrieved' })
  async listProducts(
    @Param('storeId') storeId: string,
    @Query() filters: ProductFilterParams,
  ): Promise<PaginatedResult<ProductResponseDto>> {
    return this.listProductsUseCase.execute(storeId, filters);
  }

  @Get(':productId')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiParam({ name: 'productId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Product found', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProduct(@Param('productId') productId: string): Promise<ProductResponseDto> {
    return this.getProductUseCase.execute(productId);
  }

  @Patch(':productId')
  @ApiOperation({ summary: 'Update product' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiParam({ name: 'productId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Product updated', type: ProductResponseDto })
  async updateProduct(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.updateProductUseCase.execute(productId, dto);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete product' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiParam({ name: 'productId', type: 'string' })
  @ApiResponse({ status: 204, description: 'Product deleted' })
  async deleteProduct(@Param('productId') productId: string): Promise<void> {
    return this.deleteProductUseCase.execute(productId);
  }

  @Post(':productId/duplicate')
  @ApiOperation({ summary: 'Duplicate product' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiParam({ name: 'productId', type: 'string' })
  @ApiResponse({ status: 201, description: 'Product duplicated', type: ProductResponseDto })
  async duplicateProduct(@Param('productId') productId: string): Promise<ProductResponseDto> {
    return this.duplicateProductUseCase.execute(productId);
  }
}
