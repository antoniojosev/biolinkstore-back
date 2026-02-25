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
import { CreateCategoryUseCase } from '../../application/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from '../../application/use-cases/update-category.use-case';
import { DeleteCategoryUseCase } from '../../application/use-cases/delete-category.use-case';
import { GetCategoryUseCase } from '../../application/use-cases/get-category.use-case';
import { ListCategoriesUseCase } from '../../application/use-cases/list-categories.use-case';
import { CreateCategoryDto } from '../../application/dto/create-category.dto';
import { UpdateCategoryDto } from '../../application/dto/update-category.dto';
import { CategoryResponseDto } from '../../application/dto/category-response.dto';
import { PaginatedResult, PaginationDto } from '@/common/interfaces/pagination.interface';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreOwnerGuard)
@Controller('stores/:storeId/categories')
export class CategoriesController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
    private readonly getCategoryUseCase: GetCategoryUseCase,
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 201, description: 'Category created', type: CategoryResponseDto })
  async createCategory(
    @Param('storeId') storeId: string,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.createCategoryUseCase.execute(storeId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all categories for a store' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Categories list retrieved' })
  async listCategories(
    @Param('storeId') storeId: string,
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResult<CategoryResponseDto>> {
    return this.listCategoriesUseCase.execute(storeId, pagination);
  }

  @Get(':categoryId')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiParam({ name: 'categoryId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Category found', type: CategoryResponseDto })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategory(@Param('categoryId') categoryId: string): Promise<CategoryResponseDto> {
    return this.getCategoryUseCase.execute(categoryId);
  }

  @Patch(':categoryId')
  @ApiOperation({ summary: 'Update category' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiParam({ name: 'categoryId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Category updated', type: CategoryResponseDto })
  async updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.updateCategoryUseCase.execute(categoryId, dto);
  }

  @Delete(':categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete category' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiParam({ name: 'categoryId', type: 'string' })
  @ApiResponse({ status: 204, description: 'Category deleted' })
  async deleteCategory(@Param('categoryId') categoryId: string): Promise<void> {
    return this.deleteCategoryUseCase.execute(categoryId);
  }
}
