import { OrderChannel, OrderStatus, PaymentMethodType } from '@prisma/client';

export interface OrderPaymentSnapshot {
  id: string;
  label: string;
  type: PaymentMethodType;
  details: Record<string, unknown>;
  instructions: string | null;
}

export class OrderIntent {
  id: string;
  storeId: string;
  visitorId: string | null;
  items: OrderItem[];
  subtotal: number;
  total: number;
  currency: string;
  exchangeRateSnapshot: number | null;
  exchangeRateSourceSnapshot: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  customerNotes: string | null;
  status: OrderStatus;
  channel: OrderChannel;
  whatsappNumber: string | null;
  messageGenerated: string | null;
  paymentMethodId: string | null;
  payment: OrderPaymentSnapshot | null;
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
