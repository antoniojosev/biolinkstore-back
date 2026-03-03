import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentReportDto {
  @ApiProperty({ enum: ['PLAN_UPGRADE', 'DOMAIN', 'DESIGN'] })
  @IsEnum(['PLAN_UPGRADE', 'DOMAIN', 'DESIGN'], { message: 'type must be PLAN_UPGRADE, DOMAIN, or DESIGN' })
  type: 'PLAN_UPGRADE' | 'DOMAIN' | 'DESIGN';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetPlan?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bank: string;

  @ApiProperty()
  @IsDateString()
  transferDate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  proofUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
