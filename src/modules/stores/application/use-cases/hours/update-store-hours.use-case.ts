import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '../../../domain/repositories/store.repository.interface';
import { IStoreHoursRepository } from '../../../domain/repositories/store-hours.repository.interface';
import { UpdateStoreHoursDto } from '../../dto/store-hours.dto';
import { StoreHours } from '../../../domain/entities/store-hours.entity';

@Injectable()
export class UpdateStoreHoursUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    @Inject(INJECTION_TOKENS.STORE_HOURS_REPOSITORY)
    private readonly hoursRepository: IStoreHoursRepository,
  ) {}

  async execute(storeId: string, dto: UpdateStoreHoursDto): Promise<StoreHours[]> {
    const store = await this.storeRepository.findById(storeId);
    if (!store) throw new NotFoundException('Store not found');

    const days = dto.hours.map((h) => h.dayOfWeek);
    const uniqueDays = new Set(days);
    if (uniqueDays.size !== 7) {
      throw new BadRequestException('Must provide exactly 7 unique days (0-6)');
    }
    for (const d of days) {
      if (d < 0 || d > 6) throw new BadRequestException('dayOfWeek must be between 0 and 6');
    }

    return this.hoursRepository.upsertMany(storeId, dto.hours);
  }
}
