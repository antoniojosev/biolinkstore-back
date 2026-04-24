import { StoreHours } from '../entities/store-hours.entity';

export interface StoreHoursUpsertData {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  closed: boolean;
}

export interface IStoreHoursRepository {
  findByStoreId(storeId: string): Promise<StoreHours[]>;
  upsertMany(storeId: string, entries: StoreHoursUpsertData[]): Promise<StoreHours[]>;
}
