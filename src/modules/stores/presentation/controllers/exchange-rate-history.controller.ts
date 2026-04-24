import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { StoreOwnerGuard } from '@/common/guards/store-owner.guard';
import { ListExchangeRateHistoryUseCase } from '@/modules/currency/application/use-cases/list-exchange-rate-history.use-case';
import { ExchangeRateHistory } from '@/modules/currency/domain/entities/exchange-rate-history.entity';

@ApiTags('Exchange Rate History')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stores/:storeId/exchange-rate/history')
export class ExchangeRateHistoryController {
  constructor(private readonly listHistory: ListExchangeRateHistoryUseCase) {}

  @Get()
  @UseGuards(StoreOwnerGuard)
  @ApiOperation({ summary: 'List exchange rate history for a store (paginated desc by effectiveFrom)' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({ status: 200, description: 'Rate history entries' })
  async list(
    @Param('storeId') storeId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limitRaw?: string,
  ): Promise<ExchangeRateHistory[]> {
    return this.listHistory.execute(storeId, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limitRaw ? parseInt(limitRaw, 10) : 50,
    });
  }
}
