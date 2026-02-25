import { OrderIntent } from '../entities/order-intent.entity';
import { PaginatedResult, PaginationParams } from '@/common/interfaces/pagination.interface';

export interface IOrderRepository {
  findById(id: string): Promise<OrderIntent | null>;
  findByStoreId(storeId: string, params?: PaginationParams): Promise<PaginatedResult<OrderIntent>>;
  create(data: CreateOrderData): Promise<OrderIntent>;
}

export interface CreateOrderData {
  storeId: string;
  visitorId?: string;
  items: Array<{
    productId: string;
    variantId?: string;
    productName: string;
    variantName?: string;
    unitPrice: number;
    quantity: number;
  }>;
  subtotal: number;
  total: number;
  currency: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerNotes?: string;
  channel: 'WHATSAPP' | 'INSTAGRAM';
  whatsappNumber?: string;
  messageGenerated?: string;
}
