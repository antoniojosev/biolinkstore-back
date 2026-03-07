import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
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

    // If username is being changed, check availability and update slug
    const data: UpdateStoreDto & { slug?: string } = { ...dto };
    if (dto.username && dto.username !== existingStore.username) {
      const usernameExists = await this.storeRepository.checkUsernameExists(dto.username);
      if (usernameExists) {
        throw new ConflictException('Username already in use');
      }
      data.slug = dto.username;
    } else if (dto.name && dto.name !== existingStore.name && !dto.username) {
      // If name changes but username doesn't, regenerate slug from name
      const expectedSlug = generateSlug(dto.name);
      if (!existingStore.slug.startsWith(expectedSlug)) {
        data.slug = await this.slugGeneratorService.generateUniqueSlug(dto.name);
      }
    }

    // Update store
    const store = await this.storeRepository.update(storeId, data);

    return StoreMapper.toResponse(store);
  }
}
