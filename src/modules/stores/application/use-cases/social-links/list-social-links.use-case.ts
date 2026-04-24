import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '../../../domain/repositories/store.repository.interface';
import { IStoreSocialLinkRepository } from '../../../domain/repositories/store-social-link.repository.interface';
import { StoreSocialLink } from '../../../domain/entities/store-social-link.entity';
import { buildSocialLinkRowsFromLegacyJson } from '../../../domain/services/social-link-migration.service';
import { StoreSocialLinkResponseDto } from '../../dto/store-social-link.dto';

@Injectable()
export class ListSocialLinksUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    @Inject(INJECTION_TOKENS.STORE_SOCIAL_LINK_REPOSITORY)
    private readonly socialRepository: IStoreSocialLinkRepository,
  ) {}

  async execute(storeId: string): Promise<StoreSocialLinkResponseDto[]> {
    const store = await this.storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    let rows = await this.socialRepository.findByStoreId(storeId);

    // Lazy hydrate from legacy JSON when no rows exist (BE-124)
    if (rows.length === 0 && store.socialLinks) {
      const seed = buildSocialLinkRowsFromLegacyJson(storeId, store.socialLinks);
      if (seed.length > 0) {
        await this.socialRepository.createMany(seed);
        rows = await this.socialRepository.findByStoreId(storeId);
      }
    }

    return rows.map((r) => this.toResponse(r));
  }

  private toResponse(row: StoreSocialLink): StoreSocialLinkResponseDto {
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
