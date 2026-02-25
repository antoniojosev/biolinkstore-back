import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { StoreOwnerGuard } from '@/common/guards/store-owner.guard';
import { Public } from '@/common/decorators/public.decorator';
import { CreateOrderUseCase } from '../../application/use-cases/create-order.use-case';
import { ListOrdersUseCase } from '../../application/use-cases/list-orders.use-case';
import { CreateOrderDto } from '../../application/dto/create-order.dto';
import { OrderResponseDto } from '../../application/dto/order-response.dto';
import { PaginatedResult, PaginationDto } from '@/common/interfaces/pagination.interface';

@ApiTags('Orders')
@Controller()
export class OrdersController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly listOrdersUseCase: ListOrdersUseCase,
  ) {}

  @Public()
  @Post('public/:slug/orders')
  @ApiOperation({ summary: 'Create order intent from public storefront (no auth required)' })
  @ApiParam({ name: 'slug', type: 'string', example: 'mi-tienda' })
  @ApiResponse({ status: 201, description: 'Order created', type: OrderResponseDto })
  async createPublicOrder(
    @Param('slug') slug: string,
    @Body() dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.createOrderUseCase.execute(slug, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreOwnerGuard)
  @Get('stores/:storeId/orders')
  @ApiOperation({ summary: 'List orders for a store (requires auth)' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Orders retrieved' })
  async listOrders(
    @Param('storeId') storeId: string,
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResult<OrderResponseDto>> {
    return this.listOrdersUseCase.execute(storeId, pagination);
  }
}
