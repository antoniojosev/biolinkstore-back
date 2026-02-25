import { Injectable, Inject } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '../../domain/repositories/store.repository.interface';
import { PaginatedResult, PaginationParams } from '@/common/interfaces/pagination.interface';
import { StoreResponseDto } from '../dto/store-response.dto';
import { StoreMapper } from '../mappers/store.mapper';

@Injectable()
export class ListUserStoresUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
  ) {}

  async execute(
    userId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<StoreResponseDto>> {
    const result = await this.storeRepository.findByOwnerId(userId, params);

    return {
      data: result.data.map((store) => StoreMapper.toResponse(store)),
      meta: result.meta,
    };
  }
}
