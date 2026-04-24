import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '../../../domain/repositories/store.repository.interface';
import { IStoreSocialLinkRepository } from '../../../domain/repositories/store-social-link.repository.interface';
import {
  CreateStoreSocialLinkDto,
  StoreSocialLinkResponseDto,
} from '../../dto/store-social-link.dto';

@Injectable()
export class CreateSocialLinkUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    @Inject(INJECTION_TOKENS.STORE_SOCIAL_LINK_REPOSITORY)
    private readonly socialRepository: IStoreSocialLinkRepository,
  ) {}

  async execute(
    storeId: string,
    dto: CreateStoreSocialLinkDto,
  ): Promise<StoreSocialLinkResponseDto> {
    const store = await this.storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Auto-place at the end if no explicit order provided.
    let sortOrder = dto.sortOrder;
    if (sortOrder === undefined) {
      const count = await this.socialRepository.countByStoreId(storeId);
      sortOrder = count;
    }

    const row = await this.socialRepository.create({
      storeId,
      platform: dto.platform,
      url: dto.url,
      label: dto.label ?? null,
      sortOrder,
      visible: dto.visible ?? true,
    });

    return {
      id: row.id,
      platform: row.platform,
      url: row.url,
      label: row.label,
      sortOrder: row.sortOrder,
      visible: row.visible,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
