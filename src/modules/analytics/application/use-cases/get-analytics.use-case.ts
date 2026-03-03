import { Injectable, Inject } from '@nestjs/common';
import { EventType } from '@prisma/client';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IAnalyticsRepository, AnalyticsFilterParams } from '../../domain/repositories/analytics.repository.interface';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { AnalyticsEventEntity } from '../../domain/entities/analytics-event.entity';

@Injectable()
export class GetAnalyticsUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.ANALYTICS_REPOSITORY)
    private readonly analyticsRepository: IAnalyticsRepository,
  ) {}

  async execute(
    storeId: string,
    params: AnalyticsFilterParams,
  ): Promise<PaginatedResult<AnalyticsEventEntity>> {
    return this.analyticsRepository.findByStoreId(storeId, params);
  }
}
