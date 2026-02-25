import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '../../domain/repositories/store.repository.interface';
import { UpdateStoreDto } from '../dto/update-store.dto';
import { StoreResponseDto } from '../dto/store-response.dto';
import { StoreMapper } from '../mappers/store.mapper';

@Injectable()
export class UpdateStoreUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
  ) {}

  async execute(storeId: string, dto: UpdateStoreDto): Promise<StoreResponseDto> {
    // Check if store exists
    const existingStore = await this.storeRepository.findById(storeId);
    if (!existingStore) {
      throw new NotFoundException('Store not found');
    }

    // Update store
    const store = await this.storeRepository.update(storeId, dto);

    return StoreMapper.toResponse(store);
  }
}
