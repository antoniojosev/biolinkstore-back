import { Controller, Post, Body, Ip, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@/common/decorators/public.decorator';
import { TrackLandingVisitUseCase } from '../../application/use-cases/track-landing-visit.use-case';
import { TrackLandingVisitDto } from '../../application/dto/track-landing-visit.dto';

@ApiTags('Landing Analytics')
@Controller('public/landing')
export class LandingAnalyticsController {
  constructor(private readonly trackVisit: TrackLandingVisitUseCase) {}

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('track')
  @ApiOperation({ summary: 'Track landing page visit (public, rate-limited)' })
  @ApiResponse({ status: 201, description: 'Visit tracked' })
  async track(
    @Body() dto: TrackLandingVisitDto,
    @Ip() ip: string,
    @Headers('x-forwarded-for') forwardedFor?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const clientIp = forwardedFor?.split(',')[0]?.trim() || ip;
    return this.trackVisit.execute(dto, clientIp, userAgent);
  }
}
