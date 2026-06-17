import { Controller, Get, Post, Body, Param, Query, UseGuards, Headers, Ip } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { EventType } from '@prisma/client';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { StoreOwnerGuard } from '@/common/guards/store-owner.guard';
import { Public } from '@/common/decorators/public.decorator';
import { TrackEventUseCase } from '../../application/use-cases/track-event.use-case';
import { GetStoreStatsUseCase } from '../../application/use-cases/get-store-stats.use-case';
import { GetAnalyticsUseCase } from '../../application/use-cases/get-analytics.use-case';
import { TrackStoreViewUseCase } from '../../application/use-cases/track-store-view.use-case';
import { GetStoreAnalyticsUseCase } from '../../application/use-cases/get-store-analytics.use-case';
import { TrackStoreEventUseCase } from '../../application/use-cases/track-store-event.use-case';
import { ListStoreEventsUseCase } from '../../application/use-cases/list-store-events.use-case';
import { TrackEventDto } from '../../application/dto/track-event.dto';
import { StoreStatsResponseDto } from '../../application/dto/store-stats-response.dto';
import { TrackViewDto, StoreAnalyticsResponseDto } from '../../application/dto/track-view.dto';
import {
  TrackStoreEventDto,
  TrackStoreEventResponseDto,
} from '../../application/dto/track-store-event.dto';
import {
  ListStoreEventsQueryDto,
  ListStoreEventsResponseDto,
} from '../../application/dto/list-store-events.dto';
import { GetAnalyticsSummaryUseCase } from '../../application/use-cases/get-analytics-summary.use-case';
import { GetTopProductsUseCase } from '../../application/use-cases/get-top-products.use-case';
import { GetFunnelUseCase } from '../../application/use-cases/get-funnel.use-case';
import { GetSourcesUseCase } from '../../application/use-cases/get-sources.use-case';
import {
  FunnelResponseDto,
  PeriodQueryDto,
  SourcesResponseDto,
  SummaryResponseDto,
  TopProductsQueryDto,
  TopProductsResponseDto,
} from '../../application/dto/dashboard-analytics.dto';
import { PaginationDto } from '@/common/interfaces/pagination.interface';

@ApiTags('Analytics')
@Controller()
export class AnalyticsController {
  constructor(
    private readonly trackEventUseCase: TrackEventUseCase,
    private readonly getStoreStatsUseCase: GetStoreStatsUseCase,
    private readonly getAnalyticsUseCase: GetAnalyticsUseCase,
    private readonly trackStoreViewUseCase: TrackStoreViewUseCase,
    private readonly getStoreAnalyticsUseCase: GetStoreAnalyticsUseCase,
    private readonly trackStoreEventUseCase: TrackStoreEventUseCase,
    private readonly listStoreEventsUseCase: ListStoreEventsUseCase,
    private readonly getAnalyticsSummaryUseCase: GetAnalyticsSummaryUseCase,
    private readonly getTopProductsUseCase: GetTopProductsUseCase,
    private readonly getFunnelUseCase: GetFunnelUseCase,
    private readonly getSourcesUseCase: GetSourcesUseCase,
  ) {}

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Post('public/:slug/track')
  @ApiOperation({ summary: 'Track analytics event (public, rate-limited)' })
  @ApiParam({ name: 'slug', type: 'string' })
  @ApiResponse({ status: 201, description: 'Event tracked' })
  async trackEvent(
    @Param('slug') slug: string,
    @Body() dto: TrackEventDto,
    @Ip() ip: string,
    @Headers('x-forwarded-for') forwardedFor?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const clientIp = forwardedFor?.split(',')[0]?.trim() || ip;
    return this.trackEventUseCase.execute(slug, dto, clientIp, userAgent);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreOwnerGuard)
  @Get('stores/:storeId/stats')
  @ApiOperation({ summary: 'Get store stats (dashboard)' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiResponse({ status: 200, type: StoreStatsResponseDto })
  async getStats(
    @Param('storeId') storeId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<StoreStatsResponseDto> {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    return this.getStoreStatsUseCase.execute(storeId, fromDate, toDate);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreOwnerGuard)
  @Get('stores/:storeId/analytics/legacy-events')
  @ApiOperation({
    summary:
      'List legacy AnalyticsEvent rows (visitor-bound). Renamed in BE-125 to free /analytics/events for the new StoreEvent table.',
  })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiQuery({ name: 'type', required: false, enum: EventType })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  async getLegacyEvents(
    @Param('storeId') storeId: string,
    @Query() pagination: PaginationDto,
    @Query('type') type?: EventType,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.getAnalyticsUseCase.execute(storeId, {
      ...pagination,
      type,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  @Post('public/:slug/analytics/view')
  @ApiOperation({ summary: 'Track a page view on the public storefront (rate-limited)' })
  @ApiParam({ name: 'slug', type: 'string' })
  @ApiResponse({ status: 201, description: 'View tracked' })
  async trackView(
    @Param('slug') slug: string,
    @Body() dto: TrackViewDto,
  ): Promise<{ ok: true }> {
    return this.trackStoreViewUseCase.execute(slug, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreOwnerGuard)
  @Get('stores/:storeId/analytics')
  @ApiOperation({ summary: 'Get store analytics (views, unique sessions, plan-gated scroll/time)' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  @ApiResponse({ status: 200, type: StoreAnalyticsResponseDto })
  async getStoreAnalytics(
    @Param('storeId') storeId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<StoreAnalyticsResponseDto> {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    return this.getStoreAnalyticsUseCase.execute(storeId, fromDate, toDate);
  }

  // ===========================================================================
  // BE-125: granular events ingest + dashboard listing
  // ===========================================================================

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  @Post('public/:slug/event')
  @ApiOperation({
    summary:
      'Ingest a granular storefront event (BE-125, rate-limited 60/min). FREE plans accept only PRODUCT_VIEW + WHATSAPP_CLICK; other types return ok+ignored.',
  })
  @ApiParam({ name: 'slug', type: 'string' })
  @ApiResponse({ status: 201, type: TrackStoreEventResponseDto })
  async trackStoreEvent(
    @Param('slug') slug: string,
    @Body() dto: TrackStoreEventDto,
    @Headers('referer') refererHeader?: string,
    @Headers('referrer') referrerHeader?: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<TrackStoreEventResponseDto> {
    return this.trackStoreEventUseCase.execute(slug, dto, {
      // browsers send `Referer` (typo), some clients also send `Referrer` — accept both.
      referrer: referrerHeader ?? refererHeader ?? null,
      userAgent: userAgent ?? null,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreOwnerGuard)
  @Get('stores/:storeId/analytics/events')
  @ApiOperation({
    summary:
      'List granular events for the dashboard (BE-125). Cursor-paginated by (timestamp,id) DESC. Defaults: from=now-30d, to=now, limit=50.',
  })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: ListStoreEventsResponseDto })
  async listStoreEvents(
    @Param('storeId') storeId: string,
    @Query() query: ListStoreEventsQueryDto,
  ): Promise<ListStoreEventsResponseDto> {
    return this.listStoreEventsUseCase.execute(storeId, query);
  }

  // ===========================================================================
  // BE-126: dashboard aggregations (LRU-cached, plan-gated)
  // ===========================================================================

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreOwnerGuard)
  @Get('stores/:storeId/analytics/summary')
  @ApiOperation({
    summary:
      'Aggregated dashboard summary for a period (BE-126). Includes views, event counts, conversionRate, prevPeriod and trend deltas.',
  })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: SummaryResponseDto })
  async getAnalyticsSummary(
    @Param('storeId') storeId: string,
    @Query() query: PeriodQueryDto,
  ): Promise<SummaryResponseDto> {
    return this.getAnalyticsSummaryUseCase.execute(storeId, query.period);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreOwnerGuard)
  @Get('stores/:storeId/analytics/top-products')
  @ApiOperation({
    summary:
      'Top products by weighted score (BE-126): views*1 + addToCarts*3 + whatsappClicks*5.',
  })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: TopProductsResponseDto })
  async getTopProducts(
    @Param('storeId') storeId: string,
    @Query() query: TopProductsQueryDto,
  ): Promise<TopProductsResponseDto> {
    return this.getTopProductsUseCase.execute(storeId, query.period, query.limit);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreOwnerGuard)
  @Get('stores/:storeId/analytics/funnel')
  @ApiOperation({
    summary:
      'Conversion funnel store_view -> product_view -> add_to_cart -> whatsapp_click (BE-126). PRO/BUSINESS only.',
  })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: FunnelResponseDto })
  async getFunnel(
    @Param('storeId') storeId: string,
    @Query() query: PeriodQueryDto,
  ): Promise<FunnelResponseDto> {
    return this.getFunnelUseCase.execute(storeId, query.period);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, StoreOwnerGuard)
  @Get('stores/:storeId/analytics/sources')
  @ApiOperation({
    summary:
      'Traffic source breakdown by referrer host (BE-126). Hosts collapsed into canonical buckets (instagram.com, direct, ...). PRO/BUSINESS only.',
  })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, type: SourcesResponseDto })
  async getSources(
    @Param('storeId') storeId: string,
    @Query() query: PeriodQueryDto,
  ): Promise<SourcesResponseDto> {
    return this.getSourcesUseCase.execute(storeId, query.period);
  }
}
