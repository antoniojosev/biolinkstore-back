import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { PublicStoreResponseDto } from '../dto/public-store-response.dto';

@Injectable()
export class GetPublicStoreUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
  ) {}

  async execute(slug: string): Promise<PublicStoreResponseDto> {
    const store = await this.storeRepository.findBySlug(slug);

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Return only public information
    return {
      id: store.id,
      slug: store.slug,
      name: store.name,
      description: store.description,
      logo: store.logo,
      banner: store.banner,
      primaryColor: store.primaryColor,
      secondaryColor: store.secondaryColor,
      backgroundColor: store.backgroundColor,
      textColor: store.textColor,
      font: store.font,
      template: store.template,
      whatsappNumbers: store.whatsappNumbers,
      instagramHandle: store.instagramHandle,
      facebookUrl: store.facebookUrl,
      tiktokUrl: store.tiktokUrl,
      email: store.email,
      address: store.address,
      businessHours: store.businessHours,
      showBranding: store.showBranding,
    };
  }
}
