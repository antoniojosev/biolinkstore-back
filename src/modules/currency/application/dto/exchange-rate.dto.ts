import { ApiProperty } from '@nestjs/swagger';

export class ExchangeRateResponseDto {
  @ApiProperty({ example: 'USD_BCV' })
  code: string;

  @ApiProperty({ example: 36.42 })
  rate: number;

  @ApiProperty({ example: 'https://www.bcv.org.ve/' })
  source: string;

  @ApiProperty()
  fetchedAt: Date;

  @ApiProperty({ description: 'True if rate was just refetched from provider, false if served from cache.' })
  refreshed: boolean;
}
