import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreSocialLinkRepository } from '../../../domain/repositories/store-social-link.repository.interface';
import {
  StoreSocialLinkResponseDto,
  UpdateStoreSocialLinkDto,
} from '../../dto/store-social-link.dto';

@Injectable()
export class UpdateSocialLinkUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_SOCIAL_LINK_REPOSITORY)
    private readonly socialRepository: IStoreSocialLinkRepository,
  ) {}

  async execute(
    storeId: string,
    socialId: string,
    dto: UpdateStoreSocialLinkDto,
  ): Promise<StoreSocialLinkResponseDto> {
    const existing = await this.socialRepository.findById(socialId);
    if (!existing) {
      throw new NotFoundException('Social link not found');
    }
    if (existing.storeId !== storeId) {
      throw new ForbiddenException('Social link does not belong to store');
    }

    const row = await this.socialRepository.update(socialId, dto);

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
