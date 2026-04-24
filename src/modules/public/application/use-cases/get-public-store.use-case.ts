import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { ResolveRateUseCase } from '@/modules/currency/application/use-cases/resolve-rate.use-case';
import { PublicStoreResponseDto } from '../dto/public-store-response.dto';

@Injectable()
export class GetPublicStoreUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    private readonly resolveRate: ResolveRateUseCase,
  ) {}

  async execute(slug: string): Promise<PublicStoreResponseDto> {
    const store = await this.storeRepository.findBySlug(slug);

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const resolved = await this.resolveRate.execute({
      exchangeRateMode: store.exchangeRateMode,
      exchangeRateCode: store.exchangeRateCode,
      customRate: store.customRate,
    });

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
      phone: store.phone,
      address: store.address,
      socialLinks: store.socialLinks,
      businessHours: store.businessHours,
      showBranding: store.showBranding,
      currencyConfig: store.currencyConfig,
      exchangeRate: resolved?.rate ?? null,
      exchangeRateSource: resolved?.source ?? null,
      exchangeRateCode: resolved?.code ?? store.exchangeRateCode,
    };
  }
}
