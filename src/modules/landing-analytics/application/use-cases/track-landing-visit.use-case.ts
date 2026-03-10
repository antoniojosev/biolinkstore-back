import { Injectable, Inject, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { ILandingVisitorRepository } from '../../domain/repositories/landing-visitor.repository.interface';
import { TrackLandingVisitDto } from '../dto/track-landing-visit.dto';

interface GeoData {
  country: string | null;
  city: string | null;
}

@Injectable()
export class TrackLandingVisitUseCase {
  private readonly logger = new Logger(TrackLandingVisitUseCase.name);

  constructor(
    @Inject(INJECTION_TOKENS.LANDING_VISITOR_REPOSITORY)
    private readonly repo: ILandingVisitorRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: TrackLandingVisitDto, ip?: string, userAgent?: string) {
    const geo = await this.resolveGeo(ip);

    const visitor = await this.repo.upsert({
      fingerprint: dto.fingerprint,
      ip,
      userAgent,
      referrer: dto.referrer,
      country: geo.country,
      city: geo.city,
      metadata: dto.metadata,
    });

    this.eventEmitter.emit('landing-visit.created', {
      fingerprint: visitor.fingerprint,
      ip: visitor.ip,
      country: visitor.country,
      city: visitor.city,
      referrer: visitor.referrer,
      visitCount: visitor.visitCount,
      isNew: visitor.visitCount === 1,
      timestamp: new Date().toISOString(),
    });

    return { tracked: true };
  }

  private async resolveGeo(ip?: string): Promise<GeoData> {
    if (!ip) return { country: null, city: null };

    try {
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,city`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) return { country: null, city: null };

      const data = await res.json();
      return {
        country: data.country ?? null,
        city: data.city ?? null,
      };
    } catch {
      this.logger.warn(`Geo lookup failed for ${ip}`);
      return { country: null, city: null };
    }
  }
}
