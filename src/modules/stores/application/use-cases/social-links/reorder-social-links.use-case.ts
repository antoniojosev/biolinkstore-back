import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreSocialLinkRepository } from '../../../domain/repositories/store-social-link.repository.interface';
import { ReorderStoreSocialLinksDto } from '../../dto/store-social-link.dto';

@Injectable()
export class ReorderSocialLinksUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_SOCIAL_LINK_REPOSITORY)
    private readonly socialRepository: IStoreSocialLinkRepository,
  ) {}

  async execute(storeId: string, dto: ReorderStoreSocialLinksDto): Promise<void> {
    const ids = dto.items.map((i) => i.id);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      throw new BadRequestException('Duplicate ids in reorder payload');
    }

    // Validate ownership: every id must belong to the store.
    const existing = await this.socialRepository.findByStoreId(storeId);
    const ownedIds = new Set(existing.map((r) => r.id));
    for (const id of ids) {
      if (!ownedIds.has(id)) {
        throw new ForbiddenException(`Social link ${id} does not belong to store`);
      }
    }

    await this.socialRepository.reorder(storeId, dto.items);
  }
}
