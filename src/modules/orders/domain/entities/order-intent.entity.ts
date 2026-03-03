import { OrderChannel, OrderStatus } from '@prisma/client';

export class OrderIntent {
  id: string;
  storeId: string;
  visitorId: string | null;
  items: OrderItem[];
  subtotal: number;
  total: number;
  currency: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  customerNotes: string | null;
  status: OrderStatus;
  channel: OrderChannel;
  whatsappNumber: string | null;
  messageGenerated: string | null;
  createdAt: Date;

  constructor(partial: Partial<OrderIntent>) {
    Object.assign(this, partial);
  }
}

export class OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  unitPrice: number;
  quantity: number;

  constructor(partial: Partial<OrderItem>) {
    Object.assign(this, partial);
  }
}
