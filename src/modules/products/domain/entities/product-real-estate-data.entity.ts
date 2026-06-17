export type RealEstateListingType = 'SALE' | 'RENT';

export class ProductRealEstateData {
  id: string;
  productId: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  listingType: RealEstateListingType | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ProductRealEstateData>) {
    Object.assign(this, partial);
  }
}
