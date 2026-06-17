import { Rate, StoreCustomRate, CustomRateMode } from '../entities/rate.entity';

export interface IRateRepository {
  findOfficialByCode(code: string): Promise<Rate | null>;
  findAllActiveOfficial(): Promise<Rate[]>;
  saveOfficialSnapshot(code: string, value: number): Promise<void>;

  findCustomById(id: string): Promise<StoreCustomRate | null>;
  findCustomsByStore(storeId: string): Promise<StoreCustomRate[]>;
  createCustom(data: CreateCustomRateData): Promise<StoreCustomRate>;
  updateCustom(id: string, data: UpdateCustomRateData): Promise<StoreCustomRate>;
  deleteCustom(id: string): Promise<void>;
  updateCustomFetch(id: string, value: number): Promise<void>;
}

export interface CreateCustomRateData {
  storeId: string;
  label: string;
  baseCurrency: string;
  mode: CustomRateMode;
  valueVes?: number | null;
  formula?: string | null;
  sourceUrl?: string | null;
  sourcePath?: string | null;
}

export interface UpdateCustomRateData {
  label?: string;
  baseCurrency?: string;
  mode?: CustomRateMode;
  valueVes?: number | null;
  formula?: string | null;
  sourceUrl?: string | null;
  sourcePath?: string | null;
}
