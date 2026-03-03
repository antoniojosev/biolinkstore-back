import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Header } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { StoreOwnerGuard } from '@/common/guards/store-owner.guard';
import { Public } from '@/common/decorators/public.decorator';
import { CreateOrderUseCase } from '../../application/use-cases/create-order.use-case';
import { ListOrdersUseCase } from '../../application/use-cases/list-orders.use-case';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/update-order-status.use-case';
import { ExportOrdersUseCase } from '../../application/use-cases/export-orders.use-case';
import { CreateOrderDto } from '../../application/dto/create-order.dto';
import { UpdateOrderStatusDto } from '../../application/dto/update-order-status.dto';
import { OrderResponseDto } from '../../application/dto/order-response.dto';
import { PaginatedResult, PaginationDto } from '@/common/interfaces/pagination.interface';

@ApiTags('Orders')
@Controller()
export class OrdersController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly listOrdersUseCase: ListOrdersUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly exportOrdersUseCase: ExportOrdersUseCase,
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
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiResponse({ status: 200, description: 'Orders retrieved' })
  async listOrders(
    @Param('storeId') storeId: string,
    @Query() pagination: PaginationDto,
    @Query('status') status?: OrderStatus,
  ): Promise<PaginatedResult<OrderResponseDto>> {
    return this.listOrdersUseCase.execute(storeId, { ...pagination, status });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreOwnerGuard)
  @Patch('stores/:storeId/orders/:orderId/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiParam({ name: 'orderId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @Param('storeId') storeId: string,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.updateOrderStatusUseCase.execute(storeId, orderId, dto.status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreOwnerGuard)
  @Get('stores/:storeId/orders/export')
  @ApiOperation({ summary: 'Export orders as CSV' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=cotizaciones.csv')
  async exportOrders(
    @Param('storeId') storeId: string,
  ): Promise<string> {
    return this.exportOrdersUseCase.execute(storeId);
  }
}
