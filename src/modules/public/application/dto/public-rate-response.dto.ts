import { ApiProperty } from '@nestjs/swagger';

export class PublicRateResponseDto {
  @ApiProperty({ example: 'USD_BCV' })
  code: string;

  @ApiProperty({ example: 'Dolar BCV' })
  label: string;

  @ApiProperty({ example: 'USD' })
  baseCurrency: string;

  @ApiProperty({ example: 42.5, description: 'Valor en VES' })
  valueVes: number;

  @ApiProperty({ example: '2026-04-22T22:30:00.000Z' })
  fetchedAt: Date;
}

export class StoreVisibleRatesResponseDto {
  @ApiProperty({ type: [PublicRateResponseDto] })
  rates: PublicRateResponseDto[];

  @ApiProperty({
    required: false,
    example: 'USD_BCV',
    description: 'Rate code preferido por el seller, si se configuro',
  })
  defaultRate?: string;
}
