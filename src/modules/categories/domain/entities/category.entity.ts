export class Category {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  isVisible: boolean;
  sortOrder: number;
  productCount?: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Category>) {
    Object.assign(this, partial);
  }
}
