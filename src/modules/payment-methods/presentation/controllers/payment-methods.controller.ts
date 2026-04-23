import {
  Controller,
  Get,
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
import { CreatePaymentMethodUseCase } from '../../application/use-cases/create-payment-method.use-case';
import { UpdatePaymentMethodUseCase } from '../../application/use-cases/update-payment-method.use-case';
import { ListPaymentMethodsUseCase } from '../../application/use-cases/list-payment-methods.use-case';
import { DeletePaymentMethodUseCase } from '../../application/use-cases/delete-payment-method.use-case';
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
  PaymentMethodResponseDto,
  PaymentMethodTypeDto,
} from '../../application/dto/payment-method.dto';
import { StorePaymentMethod } from '../../domain/entities/payment-method.entity';

function toResponse(m: StorePaymentMethod): PaymentMethodResponseDto {
  return {
    id: m.id,
    type: m.type as PaymentMethodTypeDto,
    label: m.label,
    details: m.details,
    instructions: m.instructions,
    enabled: m.enabled,
    displayOrder: m.displayOrder,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

@ApiTags('Payment Methods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreOwnerGuard)
@Controller('stores/:storeId/payment-methods')
export class PaymentMethodsController {
  constructor(
    private readonly createUseCase: CreatePaymentMethodUseCase,
    private readonly updateUseCase: UpdatePaymentMethodUseCase,
    private readonly listUseCase: ListPaymentMethodsUseCase,
    private readonly deleteUseCase: DeletePaymentMethodUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List payment methods for a store' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: [PaymentMethodResponseDto] })
  async list(@Param('storeId') storeId: string): Promise<PaymentMethodResponseDto[]> {
    const items = await this.listUseCase.execute(storeId);
    return items.map(toResponse);
  }

  @Post()
  @ApiOperation({ summary: 'Create a payment method' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 201, type: PaymentMethodResponseDto })
  async create(
    @Param('storeId') storeId: string,
    @Body() dto: CreatePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    const created = await this.createUseCase.execute(storeId, dto);
    return toResponse(created);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a payment method' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, type: PaymentMethodResponseDto })
  async update(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    const updated = await this.updateUseCase.execute(storeId, id, dto);
    return toResponse(updated);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a payment method' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 204 })
  async delete(
    @Param('storeId') storeId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.deleteUseCase.execute(storeId, id);
  }
}
