import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { StartInstagramImportUseCase } from '../use-cases/start-instagram-import.use-case';
import { InstagramImportRequestedEvent } from '@/modules/stores/application/use-cases/update-store.use-case';

@Injectable()
export class InstagramImportListener {
  private readonly logger = new Logger(InstagramImportListener.name);

  constructor(private readonly startImportUseCase: StartInstagramImportUseCase) {}

  @OnEvent('store.instagram-import.requested')
  handleImportRequested(event: InstagramImportRequestedEvent): void {
    this.startImportUseCase
      .execute(event.storeId, event.handle)
      .catch((err) =>
        this.logger.error(`Fallo al arrancar import para store ${event.storeId}: ${(err as Error).message}`),
      );
  }
}
