import { ApiProperty } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  variantId: string | null;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  variantName: string | null;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  quantity: number;
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  storeId: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  customerName: string | null;

  @ApiProperty()
  customerPhone: string | null;

  @ApiProperty()
  customerEmail: string | null;

  @ApiProperty()
  customerAddress: string | null;

  @ApiProperty()
  customerNotes: string | null;

  @ApiProperty({ enum: ['PENDING', 'CONTACTED', 'ACCEPTED', 'REJECTED'] })
  status: 'PENDING' | 'CONTACTED' | 'ACCEPTED' | 'REJECTED';

  @ApiProperty({ enum: ['WHATSAPP', 'INSTAGRAM'] })
  channel: 'WHATSAPP' | 'INSTAGRAM';

  @ApiProperty()
  whatsappNumber: string | null;

  @ApiProperty()
  messageGenerated: string | null;

  @ApiProperty()
  whatsappUrl: string | null;

  @ApiProperty()
  createdAt: Date;
}
