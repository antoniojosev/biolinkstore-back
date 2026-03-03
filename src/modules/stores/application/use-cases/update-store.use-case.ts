import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '../../domain/repositories/store.repository.interface';
import { SlugGeneratorService } from '../../domain/services/slug-generator.service';
import { generateSlug } from '@/common/utils/slug.util';
import { UpdateStoreDto } from '../dto/update-store.dto';
import { StoreResponseDto } from '../dto/store-response.dto';
import { StoreMapper } from '../mappers/store.mapper';

@Injectable()
export class UpdateStoreUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    private readonly slugGeneratorService: SlugGeneratorService,
  ) {}

  async execute(storeId: string, dto: UpdateStoreDto): Promise<StoreResponseDto> {
    // Check if store exists
    const existingStore = await this.storeRepository.findById(storeId);
    if (!existingStore) {
      throw new NotFoundException('Store not found');
    }

    // Keep slug in sync with the store name
    const data: UpdateStoreDto & { slug?: string } = { ...dto };
    const effectiveName = dto.name ?? existingStore.name;
    const expectedSlug = generateSlug(effectiveName);
    if (!existingStore.slug.startsWith(expectedSlug)) {
      data.slug = await this.slugGeneratorService.generateUniqueSlug(effectiveName);
    }

    // Update store
    const store = await this.storeRepository.update(storeId, data);

    return StoreMapper.toResponse(store);
  }
}
