import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { StoreOwnerGuard } from '@/common/guards/store-owner.guard';
import { CreateVariantUseCase } from '../../application/use-cases/create-variant.use-case';
import { UpdateVariantUseCase } from '../../application/use-cases/update-variant.use-case';
import { DeleteVariantUseCase } from '../../application/use-cases/delete-variant.use-case';
import { CreateVariantDto } from '../../application/dto/create-variant.dto';
import { UpdateVariantDto } from '../../application/dto/update-variant.dto';
import { ProductVariantResponseDto } from '../../application/dto/product-response.dto';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreOwnerGuard)
@Controller('stores/:storeId/products/:productId/variants')
export class VariantsController {
  constructor(
    private readonly createVariantUseCase: CreateVariantUseCase,
    private readonly updateVariantUseCase: UpdateVariantUseCase,
    private readonly deleteVariantUseCase: DeleteVariantUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a product variant' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiParam({ name: 'productId', type: 'string' })
  @ApiResponse({ status: 201, description: 'Variant created', type: ProductVariantResponseDto })
  async createVariant(
    @Param('productId') productId: string,
    @Body() dto: CreateVariantDto,
  ): Promise<ProductVariantResponseDto> {
    return this.createVariantUseCase.execute(productId, dto);
  }

  @Patch(':variantId')
  @ApiOperation({ summary: 'Update a product variant' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiParam({ name: 'productId', type: 'string' })
  @ApiParam({ name: 'variantId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Variant updated', type: ProductVariantResponseDto })
  async updateVariant(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ): Promise<ProductVariantResponseDto> {
    return this.updateVariantUseCase.execute(variantId, dto);
  }

  @Delete(':variantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product variant' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiParam({ name: 'productId', type: 'string' })
  @ApiParam({ name: 'variantId', type: 'string' })
  @ApiResponse({ status: 204, description: 'Variant deleted' })
  async deleteVariant(@Param('variantId') variantId: string): Promise<void> {
    return this.deleteVariantUseCase.execute(variantId);
  }
}
