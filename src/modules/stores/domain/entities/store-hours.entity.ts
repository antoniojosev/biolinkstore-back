export class StoreHours {
  id: string;
  storeId: string;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  openTime: string; // "HH:mm"
  closeTime: string; // "HH:mm"
  closed: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<StoreHours>) {
    Object.assign(this, partial);
  }
}
