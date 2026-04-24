import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Plan, StoreEventType } from '@prisma/client';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { IStoreEventRepository } from '../../domain/repositories/store-event.repository.interface';
import { TrackStoreEventDto } from '../dto/track-store-event.dto';

export interface TrackStoreEventResult {
  ok: true;
  ignored: boolean;
}

/**
 * BE-125: ingests a granular storefront event (product view, add to cart,
 * whatsapp click, ...). Plan-gated:
 *   - FREE: only PRODUCT_VIEW + WHATSAPP_CLICK persist; other types are
 *     silently dropped (returned with ignored=true) so the storefront can
 *     stay plan-agnostic.
 *   - PRO/BUSINESS: all event types persist.
 */
@Injectable()
export class TrackStoreEventUseCase {
  /** Maximum metadata size after JSON serialization. Keeps payloads bounded. */
  private static readonly METADATA_MAX_BYTES = 4 * 1024;

  /** Events allowed for stores without a paid plan. */
  private static readonly FREE_PLAN_ALLOWED: ReadonlySet<StoreEventType> = new Set([
    StoreEventType.PRODUCT_VIEW,
    StoreEventType.WHATSAPP_CLICK,
  ]);

  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    @Inject(INJECTION_TOKENS.STORE_EVENT_REPOSITORY)
    private readonly eventRepository: IStoreEventRepository,
  ) {}

  async execute(
    slug: string,
    dto: TrackStoreEventDto,
    headers: { referrer?: string | null; userAgent?: string | null } = {},
  ): Promise<TrackStoreEventResult> {
    // findBySlug already eager-loads subscription so plan gating is one query.
    const store = await this.storeRepository.findBySlug(slug);
    if (!store) throw new NotFoundException('Store not found');

    const plan = store.subscription?.plan ?? Plan.FREE;
    if (!this.canIngest(plan, dto.type)) {
      return { ok: true, ignored: true };
    }

    await this.eventRepository.create({
      storeId: store.id,
      type: dto.type,
      targetId: dto.targetId ?? null,
      metadata: this.normalizeMetadata(dto.metadata),
      sessionId: dto.sessionId ?? null,
      referrer: this.truncate(headers.referrer ?? null, 512),
      userAgent: this.truncate(headers.userAgent ?? null, 512),
    });

    return { ok: true, ignored: false };
  }

  private canIngest(plan: Plan, type: StoreEventType): boolean {
    if (plan === Plan.PRO || plan === Plan.BUSINESS) return true;
    return TrackStoreEventUseCase.FREE_PLAN_ALLOWED.has(type);
  }

  /**
   * Drops payloads bigger than METADATA_MAX_BYTES (after JSON.stringify) to
   * keep events cheap to query and to avoid hostile inputs.
   */
  private normalizeMetadata(
    metadata?: Record<string, unknown> | null,
  ): Record<string, unknown> | null {
    if (!metadata) return null;
    try {
      const serialized = JSON.stringify(metadata);
      if (Buffer.byteLength(serialized, 'utf8') > TrackStoreEventUseCase.METADATA_MAX_BYTES) {
        return null;
      }
      return metadata;
    } catch {
      return null;
    }
  }

  private truncate(value: string | null, max: number): string | null {
    if (!value) return null;
    return value.length > max ? value.slice(0, max) : value;
  }
}
