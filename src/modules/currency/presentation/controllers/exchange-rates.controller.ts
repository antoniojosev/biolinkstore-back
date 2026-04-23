import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { GetCurrentRateUseCase } from '../../application/use-cases/get-current-rate.use-case';
import { ExchangeRateResponseDto } from '../../application/dto/exchange-rate.dto';

@ApiTags('Exchange Rates')
@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly getCurrentRate: GetCurrentRateUseCase) {}

  @Public()
  @Get(':code')
  @ApiOperation({
    summary: 'Get latest exchange rate for code (lazy refresh, 2h TTL)',
  })
  @ApiParam({ name: 'code', example: 'USD_BCV' })
  @ApiResponse({ status: 200, type: ExchangeRateResponseDto })
  get(@Param('code') code: string): Promise<ExchangeRateResponseDto> {
    return this.getCurrentRate.execute(code);
  }
}
