import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
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
    const existingStore = await this.storeRepository.findById(storeId);
    if (!existingStore) {
      throw new NotFoundException('Store not found');
    }

    // Slug always equals username — update both together
    const data: UpdateStoreDto & { slug?: string } = { ...dto };
    if (dto.username && dto.username !== existingStore.username) {
      const usernameExists = await this.storeRepository.checkUsernameExists(dto.username);
      if (usernameExists) {
        throw new ConflictException('Username already in use');
      }
      data.slug = dto.username;
    }

    // Update store
    const store = await this.storeRepository.update(storeId, data);

    return StoreMapper.toResponse(store);
  }
}
