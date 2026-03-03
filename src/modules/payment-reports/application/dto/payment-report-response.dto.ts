import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentReportResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  storeId: string;

  @ApiProperty({ enum: ['PLAN_UPGRADE', 'DOMAIN', 'DESIGN'] })
  type: string;

  @ApiPropertyOptional()
  targetPlan?: string | null;

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  status: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  bank: string;

  @ApiProperty()
  transferDate: Date;

  @ApiProperty()
  proofUrl: string;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty()
  createdAt: Date;
}
