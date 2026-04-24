export type ServiceModality = 'IN_PERSON' | 'ONLINE' | 'HYBRID';

export class ProductServiceData {
  id: string;
  productId: string;
  duration: number | null;
  modality: ServiceModality | null;
  coverage: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ProductServiceData>) {
    Object.assign(this, partial);
  }
}
