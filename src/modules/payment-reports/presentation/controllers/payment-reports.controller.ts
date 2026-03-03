import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { StoreOwnerGuard } from '@/common/guards/store-owner.guard';
import { CreatePaymentReportUseCase } from '../../application/use-cases/create-payment-report.use-case';
import { ListPaymentReportsUseCase } from '../../application/use-cases/list-payment-reports.use-case';
import { CreatePaymentReportDto } from '../../application/dto/create-payment-report.dto';
import { PaymentReportResponseDto } from '../../application/dto/payment-report-response.dto';

@ApiTags('Payment Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreOwnerGuard)
@Controller('stores/:storeId/payment-reports')
export class PaymentReportsController {
  constructor(
    private readonly createPaymentReportUseCase: CreatePaymentReportUseCase,
    private readonly listPaymentReportsUseCase: ListPaymentReportsUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Report a payment (bank transfer)' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 201, description: 'Payment report created', type: PaymentReportResponseDto })
  async create(
    @Param('storeId') storeId: string,
    @Body() dto: CreatePaymentReportDto,
  ): Promise<PaymentReportResponseDto> {
    return this.createPaymentReportUseCase.execute(storeId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List payment reports for a store' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, description: 'List of payment reports', type: [PaymentReportResponseDto] })
  async list(@Param('storeId') storeId: string): Promise<PaymentReportResponseDto[]> {
    return this.listPaymentReportsUseCase.execute(storeId);
  }
}
