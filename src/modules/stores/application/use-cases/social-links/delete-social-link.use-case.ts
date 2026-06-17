import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreSocialLinkRepository } from '../../../domain/repositories/store-social-link.repository.interface';

@Injectable()
export class DeleteSocialLinkUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_SOCIAL_LINK_REPOSITORY)
    private readonly socialRepository: IStoreSocialLinkRepository,
  ) {}

  async execute(storeId: string, socialId: string): Promise<void> {
    const existing = await this.socialRepository.findById(socialId);
    if (!existing) {
      throw new NotFoundException('Social link not found');
    }
    if (existing.storeId !== storeId) {
      throw new ForbiddenException('Social link does not belong to store');
    }
    await this.socialRepository.delete(socialId);
  }
}
