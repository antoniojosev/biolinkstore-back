import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { StoreOwnerGuard } from '@/common/guards/store-owner.guard';
import {
  ExchangeRateConfigResponseDto,
  UpdateExchangeRateConfigDto,
} from '../../application/dto/exchange-rate-config.dto';
import { GetExchangeRateConfigUseCase } from '../../application/use-cases/exchange-rate/get-exchange-rate-config.use-case';
import { UpdateExchangeRateConfigUseCase } from '../../application/use-cases/exchange-rate/update-exchange-rate-config.use-case';

@ApiTags('Store Exchange Rate')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StoreOwnerGuard)
@Controller('stores/:storeId/exchange-rate')
export class ExchangeRateConfigController {
  constructor(
    private readonly getUseCase: GetExchangeRateConfigUseCase,
    private readonly updateUseCase: UpdateExchangeRateConfigUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get exchange rate config (mode + resolved rate)' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: ExchangeRateConfigResponseDto })
  get(@Param('storeId') storeId: string): Promise<ExchangeRateConfigResponseDto> {
    return this.getUseCase.execute(storeId);
  }

  @Put()
  @ApiOperation({ summary: 'Update exchange rate mode/customRate (MANUAL only PRO+)' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: ExchangeRateConfigResponseDto })
  update(
    @Param('storeId') storeId: string,
    @Body() dto: UpdateExchangeRateConfigDto,
  ): Promise<ExchangeRateConfigResponseDto> {
    return this.updateUseCase.execute(storeId, dto);
  }
}
