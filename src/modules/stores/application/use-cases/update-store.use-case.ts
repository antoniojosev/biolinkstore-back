import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '../../domain/repositories/store.repository.interface';
import { UpdateStoreDto } from '../dto/update-store.dto';
import { StoreResponseDto } from '../dto/store-response.dto';
import { StoreMapper } from '../mappers/store.mapper';

export interface InstagramImportRequestedEvent {
  storeId: string;
  handle: string;
}

@Injectable()
export class UpdateStoreUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(storeId: string, dto: UpdateStoreDto): Promise<StoreResponseDto> {
    const existingStore = await this.storeRepository.findById(storeId);
    if (!existingStore) {
      throw new NotFoundException('Store not found');
    }

    // Slug always equals username — update both together
    const { requestInstagramImport, ...rest } = dto;
    const data: Omit<UpdateStoreDto, 'requestInstagramImport'> & {
      slug?: string;
      instagramImportRequestedAt?: Date | null;
    } = { ...rest };
    if (requestInstagramImport !== undefined) {
      data.instagramImportRequestedAt = requestInstagramImport ? new Date() : null;
    }
    if (dto.username && dto.username !== existingStore.username) {
      const usernameExists = await this.storeRepository.checkUsernameExists(dto.username);
      if (usernameExists) {
        throw new ConflictException('Username already in use');
      }
      data.slug = dto.username;
    }

    // Update store
    const store = await this.storeRepository.update(storeId, data);

    // Trigger the real Instagram import pipeline only on the transition into
    // "requested" (not on every save while it's already pending/running) and
    // only when we actually have a handle to scrape.
    const handle = dto.instagramHandle ?? existingStore.instagramHandle;
    if (
      requestInstagramImport === true &&
      !existingStore.instagramImportRequestedAt &&
      handle
    ) {
      this.eventEmitter.emit('store.instagram-import.requested', {
        storeId,
        handle,
      } satisfies InstagramImportRequestedEvent);
    }

    return StoreMapper.toResponse(store);
  }
}
