import { OrderStatus } from '@prisma/client';
import { OrderIntent } from '../entities/order-intent.entity';
import { PaginatedResult, PaginationParams } from '@/common/interfaces/pagination.interface';

export interface OrderFilterParams extends PaginationParams {
  status?: OrderStatus;
}

export interface IOrderRepository {
  findById(id: string): Promise<OrderIntent | null>;
  findByStoreId(storeId: string, params?: OrderFilterParams): Promise<PaginatedResult<OrderIntent>>;
  create(data: CreateOrderData): Promise<OrderIntent>;
  updateStatus(id: string, status: OrderStatus): Promise<OrderIntent>;
  countByStoreId(storeId: string, since?: Date): Promise<number>;
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
