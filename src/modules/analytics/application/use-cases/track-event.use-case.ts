import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { IAnalyticsRepository } from '../../domain/repositories/analytics.repository.interface';
import { IVisitorRepository } from '../../domain/repositories/visitor.repository.interface';
import { TrackEventDto } from '../dto/track-event.dto';

@Injectable()
export class TrackEventUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    @Inject(INJECTION_TOKENS.ANALYTICS_REPOSITORY)
    private readonly analyticsRepository: IAnalyticsRepository,
    @Inject(INJECTION_TOKENS.VISITOR_REPOSITORY)
    private readonly visitorRepository: IVisitorRepository,
  ) {}

  async execute(slug: string, dto: TrackEventDto, ip?: string, userAgent?: string) {
    const store = await this.storeRepository.findBySlug(slug);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Upsert visitor
    const visitor = await this.visitorRepository.upsert({
      storeId: store.id,
      visitorId: dto.visitorId,
      userAgent,
      ip,
    });

    // Create analytics event
    await this.analyticsRepository.create({
      storeId: store.id,
      visitorId: visitor.id,
      productId: dto.productId,
      type: dto.type,
      metadata: {
        ...dto.metadata,
        ip,
        userAgent,
      },
    });

    return { success: true };
  }
}
