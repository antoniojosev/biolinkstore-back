import { Inject, Injectable, Logger } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IInstagramImportRepository } from '../../domain/repositories/instagram-import.repository.interface';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { ApifyInstagramClient } from '../../infrastructure/apify/apify-instagram.client';
import { PollInstagramImportUseCase } from './poll-instagram-import.use-case';
import { getIgImportPostLimit } from '../ig-import-plan-limits.util';

/**
 * Dispara la corrida real de Apify para una tienda. Se llama desde el
 * listener de 'store.instagram-import.requested' (emitido por
 * UpdateStoreUseCase) — nunca desde un controller directo, para que la
 * tienda no dependa de este modulo.
 */
@Injectable()
export class StartInstagramImportUseCase {
  private readonly logger = new Logger(StartInstagramImportUseCase.name);

  constructor(
    @Inject(INJECTION_TOKENS.INSTAGRAM_IMPORT_REPOSITORY)
    private readonly repository: IInstagramImportRepository,
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    private readonly apifyClient: ApifyInstagramClient,
    private readonly pollUseCase: PollInstagramImportUseCase,
  ) {}

  async execute(storeId: string, handle: string): Promise<void> {
    const existingActive = await this.repository.findActiveByStoreId(storeId);
    if (existingActive) {
      this.logger.warn(`Store ${storeId} ya tiene un import activo (${existingActive.id})`);
      return;
    }

    const store = await this.storeRepository.findByIdWithSubscription(storeId);
    const resultsLimit = getIgImportPostLimit(store?.subscription?.plan);

    const cleanHandle = handle.replace(/^@/, '').trim();
    const record = await this.repository.create({ storeId, handle: cleanHandle });

    try {
      const { runId } = await this.apifyClient.startRun(cleanHandle, resultsLimit);
      await this.repository.update(record.id, { apifyRunId: runId });
    } catch (err) {
      await this.repository.update(record.id, {
        status: 'FAILED',
        error: `No se pudo arrancar el scraping: ${(err as Error).message}`,
        finishedAt: new Date(),
      });
      return;
    }

    // Fire-and-forget: el poll real corre en background, sin bloquear quien
    // dispare este use-case (el listener del evento).
    this.pollUseCase.tryResume(record.id);
  }
}
