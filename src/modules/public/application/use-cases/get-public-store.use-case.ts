import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { IStoreHoursRepository } from '@/modules/stores/domain/repositories/store-hours.repository.interface';
import { StoreHoursService } from '@/modules/stores/domain/services/store-hours.service';
import { PublicStoreResponseDto } from '../dto/public-store-response.dto';

@Injectable()
export class GetPublicStoreUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    @Inject(INJECTION_TOKENS.STORE_HOURS_REPOSITORY)
    private readonly hoursRepository: IStoreHoursRepository,
    private readonly hoursService: StoreHoursService,
  ) {}

  async execute(slug: string): Promise<PublicStoreResponseDto> {
    const store = await this.storeRepository.findBySlug(slug);

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const hours = await this.hoursRepository.findByStoreId(store.id);

    const hoursPayload = hours.length > 0
      ? hours.map((h) => ({
          dayOfWeek: h.dayOfWeek,
          openTime: h.openTime,
          closeTime: h.closeTime,
          closed: h.closed,
        }))
      : null;

    const isOpenNow = hours.length > 0 ? this.hoursService.isStoreOpenNow(hours) : false;

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
      hours: hoursPayload,
      isOpenNow,
      cta: {
        type: store.ctaType,
        label: store.ctaLabel,
        url: store.ctaUrl,
      },
      aboutShort: store.aboutShort,
      aboutLong: store.aboutLong,
      locationLat: store.locationLat,
      locationLng: store.locationLng,
      locationLabel: store.locationLabel,
    };
  }
}
