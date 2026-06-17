import { StorePaymentMethod, PaymentMethodType } from '../entities/payment-method.entity';

export interface CreatePaymentMethodData {
  storeId: string;
  type: PaymentMethodType;
  label: string;
  details: Record<string, unknown>;
  instructions?: string | null;
  enabled?: boolean;
  displayOrder?: number;
}

export interface UpdatePaymentMethodData {
  type?: PaymentMethodType;
  label?: string;
  details?: Record<string, unknown>;
  instructions?: string | null;
  enabled?: boolean;
  displayOrder?: number;
}

export interface IPaymentMethodRepository {
  findById(id: string): Promise<StorePaymentMethod | null>;
  findByStoreId(storeId: string): Promise<StorePaymentMethod[]>;
  countByStoreId(storeId: string): Promise<number>;
  create(data: CreatePaymentMethodData): Promise<StorePaymentMethod>;
  update(id: string, data: UpdatePaymentMethodData): Promise<StorePaymentMethod>;
  delete(id: string): Promise<void>;
}
