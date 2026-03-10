import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { ILandingVisitorRepository } from '../../domain/repositories/landing-visitor.repository.interface';
import { TrackLandingVisitDto } from '../dto/track-landing-visit.dto';

@Injectable()
export class TrackLandingVisitUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.LANDING_VISITOR_REPOSITORY)
    private readonly repo: ILandingVisitorRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(dto: TrackLandingVisitDto, ip?: string, userAgent?: string) {
    const visitor = await this.repo.upsert({
      fingerprint: dto.fingerprint,
      ip,
      userAgent,
      referrer: dto.referrer,
      metadata: dto.metadata,
    });

    this.eventEmitter.emit('landing-visit.created', {
      fingerprint: visitor.fingerprint,
      ip: visitor.ip,
      referrer: visitor.referrer,
      visitCount: visitor.visitCount,
      isNew: visitor.visitCount === 1,
      timestamp: new Date().toISOString(),
    });

    return { tracked: true };
  }
}
