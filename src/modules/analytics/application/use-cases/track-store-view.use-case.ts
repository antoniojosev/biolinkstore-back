import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { IStoreViewRepository } from '../../domain/repositories/store-view.repository.interface';
import { TrackViewDto } from '../dto/track-view.dto';

@Injectable()
export class TrackStoreViewUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    @Inject(INJECTION_TOKENS.STORE_VIEW_REPOSITORY)
    private readonly viewRepository: IStoreViewRepository,
  ) {}

  async execute(slug: string, dto: TrackViewDto): Promise<{ ok: true }> {
    const store = await this.storeRepository.findBySlug(slug);
    if (!store) throw new NotFoundException('Store not found');

    await this.viewRepository.create({
      storeId: store.id,
      sessionId: dto.sessionId,
      referrer: dto.referrer ?? null,
      country: dto.country ?? null,
      device: dto.device ?? null,
      scrollDepth: dto.scrollDepth ?? null,
      timeOnPage: dto.timeOnPage ?? null,
    });

    return { ok: true };
  }
}
