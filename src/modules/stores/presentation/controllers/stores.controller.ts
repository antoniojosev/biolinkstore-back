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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { StoreOwnerGuard } from '@/common/guards/store-owner.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CreateStoreUseCase } from '../../application/use-cases/create-store.use-case';
import { UpdateStoreUseCase } from '../../application/use-cases/update-store.use-case';
import { GetStoreUseCase } from '../../application/use-cases/get-store.use-case';
import { ListUserStoresUseCase } from '../../application/use-cases/list-user-stores.use-case';
import { DeleteStoreUseCase } from '../../application/use-cases/delete-store.use-case';
import { CreateStoreDto } from '../../application/dto/create-store.dto';
import { UpdateStoreDto } from '../../application/dto/update-store.dto';
import { StoreResponseDto } from '../../application/dto/store-response.dto';
import { PaginationDto, PaginatedResult } from '@/common/interfaces/pagination.interface';

@ApiTags('Stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stores')
export class StoresController {
  constructor(
    private readonly createStoreUseCase: CreateStoreUseCase,
    private readonly updateStoreUseCase: UpdateStoreUseCase,
    private readonly getStoreUseCase: GetStoreUseCase,
    private readonly listUserStoresUseCase: ListUserStoresUseCase,
    private readonly deleteStoreUseCase: DeleteStoreUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new store' })
  @ApiResponse({ status: 201, description: 'Store created', type: StoreResponseDto })
  async createStore(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateStoreDto,
  ): Promise<StoreResponseDto> {
    return this.createStoreUseCase.execute(user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all stores for current user' })
  @ApiResponse({ status: 200, description: 'List of user stores' })
  async getUserStores(
    @CurrentUser() user: { userId: string },
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResult<StoreResponseDto>> {
    return this.listUserStoresUseCase.execute(user.userId, pagination);
  }

  @Get(':storeId')
  @UseGuards(StoreOwnerGuard)
  @ApiOperation({ summary: 'Get store by ID' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Store found', type: StoreResponseDto })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async getStore(@Param('storeId') storeId: string): Promise<StoreResponseDto> {
    return this.getStoreUseCase.execute(storeId);
  }

  @Patch(':storeId')
  @UseGuards(StoreOwnerGuard)
  @ApiOperation({ summary: 'Update store' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Store updated', type: StoreResponseDto })
  async updateStore(
    @Param('storeId') storeId: string,
    @Body() dto: UpdateStoreDto,
  ): Promise<StoreResponseDto> {
    return this.updateStoreUseCase.execute(storeId, dto);
  }

  @Delete(':storeId')
  @UseGuards(StoreOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete store' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 204, description: 'Store deleted' })
  async deleteStore(@Param('storeId') storeId: string): Promise<void> {
    return this.deleteStoreUseCase.execute(storeId);
  }
}
