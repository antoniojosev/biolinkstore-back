import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '../../../domain/repositories/store.repository.interface';
import { IStoreHoursRepository } from '../../../domain/repositories/store-hours.repository.interface';
import { StoreHoursService } from '../../../domain/services/store-hours.service';
import { StoreHours } from '../../../domain/entities/store-hours.entity';

@Injectable()
export class GetStoreHoursUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    @Inject(INJECTION_TOKENS.STORE_HOURS_REPOSITORY)
    private readonly hoursRepository: IStoreHoursRepository,
    private readonly hoursService: StoreHoursService,
  ) {}

  async execute(storeId: string): Promise<StoreHours[]> {
    const store = await this.storeRepository.findById(storeId);
    if (!store) throw new NotFoundException('Store not found');

    const existing = await this.hoursRepository.findByStoreId(storeId);
    if (existing.length === 7) return existing;

    // Lazy create: fill missing days with defaults.
    const defaults = this.hoursService.buildDefaults();
    const existingByDay = new Map(existing.map((h) => [h.dayOfWeek, h]));
    const merged = defaults.map((d) => {
      const e = existingByDay.get(d.dayOfWeek);
      return e ? { ...e } : d;
    });

    return this.hoursRepository.upsertMany(storeId, merged);
  }
}
