import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '../../domain/repositories/store.repository.interface';
import { StoreResponseDto } from '../dto/store-response.dto';
import { StoreMapper } from '../mappers/store.mapper';

@Injectable()
export class GetStoreUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
  ) {}

  async execute(storeId: string): Promise<StoreResponseDto> {
    const store = await this.storeRepository.findByIdWithSubscription(storeId);

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return StoreMapper.toResponse(store);
  }
}
