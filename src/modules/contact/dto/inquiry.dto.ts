import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InquiryDto {
  @ApiProperty({ enum: ['DESIGN', 'CUSTOM_PLAN'] })
  @IsEnum(['DESIGN', 'CUSTOM_PLAN'])
  type: 'DESIGN' | 'CUSTOM_PLAN';

  @ApiProperty()
  @IsString()
  storeId: string;

  @ApiProperty()
  @IsString()
  storeName: string;

  @ApiProperty({ enum: ['whatsapp', 'email'] })
  @IsEnum(['whatsapp', 'email'])
  method: 'whatsapp' | 'email';

  @ApiProperty({ description: 'Phone number or email address' })
  @IsString()
  contact: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
