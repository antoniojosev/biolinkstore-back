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
import { TrackEventDto } from '../../application/dto/track-event.dto';
import { StoreStatsResponseDto } from '../../application/dto/store-stats-response.dto';
import { TrackViewDto, StoreAnalyticsResponseDto } from '../../application/dto/track-view.dto';
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
  @Get('stores/:storeId/analytics/events')
  @ApiOperation({ summary: 'Get analytics events (paginated)' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiQuery({ name: 'type', required: false, enum: EventType })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  async getEvents(
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
}
