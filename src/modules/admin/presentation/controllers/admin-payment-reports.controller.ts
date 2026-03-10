import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Observable, Subject, merge } from 'rxjs';
import { OnEvent } from '@nestjs/event-emitter';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Admin')
@Public()
@Controller('admin')
export class AdminEventsController {
  private readonly paymentReport$ = new Subject<MessageEvent>();
  private readonly landingVisit$ = new Subject<MessageEvent>();

  @Sse('events/stream')
  @ApiOperation({ summary: 'SSE stream for admin notifications' })
  stream(): Observable<MessageEvent> {
    return merge(this.paymentReport$, this.landingVisit$);
  }

  @OnEvent('payment-report.created')
  handlePaymentReportCreated(payload: Record<string, unknown>) {
    this.paymentReport$.next({
      data: { type: 'payment-report', ...payload },
    } as MessageEvent);
  }

  @OnEvent('landing-visit.created')
  handleLandingVisit(payload: Record<string, unknown>) {
    this.landingVisit$.next({
      data: { type: 'landing-visit', ...payload },
    } as MessageEvent);
  }
}
