import { Inject, Injectable } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreEventRepository } from '../../domain/repositories/store-event.repository.interface';
import {
  ListStoreEventsQueryDto,
  ListStoreEventsResponseDto,
  StoreEventItemDto,
} from '../dto/list-store-events.dto';

@Injectable()
export class ListStoreEventsUseCase {
  /** Default look-back window when neither `from` nor `to` is provided. */
  private static readonly DEFAULT_WINDOW_DAYS = 30;
  /** Default page size. */
  private static readonly DEFAULT_LIMIT = 50;

  constructor(
    @Inject(INJECTION_TOKENS.STORE_EVENT_REPOSITORY)
    private readonly eventRepository: IStoreEventRepository,
  ) {}

  async execute(
    storeId: string,
    query: ListStoreEventsQueryDto,
  ): Promise<ListStoreEventsResponseDto> {
    const now = new Date();
    const defaultFrom = new Date(
      now.getTime() - ListStoreEventsUseCase.DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );

    const from = query.from ? new Date(query.from) : defaultFrom;
    const to = query.to ? new Date(query.to) : now;

    const result = await this.eventRepository.list({
      storeId,
      from,
      to,
      type: query.type,
      cursor: query.cursor,
      limit: query.limit ?? ListStoreEventsUseCase.DEFAULT_LIMIT,
    });

    const data: StoreEventItemDto[] = result.data.map((event) => ({
      id: event.id,
      type: event.type,
      targetId: event.targetId,
      metadata: event.metadata,
      sessionId: event.sessionId,
      referrer: event.referrer,
      userAgent: event.userAgent,
      timestamp: event.timestamp.toISOString(),
    }));

    return { data, nextCursor: result.nextCursor };
  }
}
