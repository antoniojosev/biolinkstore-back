import { Inject, Injectable, Logger } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IInstagramImportRepository } from '../../domain/repositories/instagram-import.repository.interface';
import { InstagramImport } from '../../domain/entities/instagram-import.entity';
import { ApifyInstagramClient } from '../../infrastructure/apify/apify-instagram.client';
import { ProcessInstagramPostUseCase } from './process-instagram-post.use-case';
import { ImportProcessingLockService } from '../services/import-processing-lock.service';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';

const APIFY_POLL_INTERVAL_MS = 5000;
const APIFY_POLL_TIMEOUT_MS = 5 * 60 * 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Orquesta una corrida completa: espera a que Apify termine, y despues
 * procesa los posts UNO POR UNO (no en paralelo) actualizando contadores en
 * cada paso — es lo que le da al polling del frontend progreso real en vez
 * de un resultado final de una sola vez. Se dispara fire-and-forget desde
 * StartInstagramImportUseCase, y se puede volver a llamar (resume) desde
 * GetInstagramImportStatusUseCase si el proceso original murio a mitad de
 * camino (el ImportProcessingLockService evita que corran dos a la vez).
 */
@Injectable()
export class PollInstagramImportUseCase {
  private readonly logger = new Logger(PollInstagramImportUseCase.name);

  constructor(
    @Inject(INJECTION_TOKENS.INSTAGRAM_IMPORT_REPOSITORY)
    private readonly repository: IInstagramImportRepository,
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    private readonly apifyClient: ApifyInstagramClient,
    private readonly processPost: ProcessInstagramPostUseCase,
    private readonly lock: ImportProcessingLockService,
  ) {}

  /** Intenta avanzar un import (arranca el trabajo solo si nadie mas lo esta procesando ya). */
  tryResume(importId: string): void {
    if (!this.lock.tryAcquire(importId)) return;
    this.run(importId)
      .catch((err) => this.logger.error(`Import ${importId} fallo: ${(err as Error).message}`))
      .finally(() => this.lock.release(importId));
  }

  private async run(importId: string): Promise<void> {
    let record = await this.repository.findById(importId);
    if (!record || record.status === 'DONE' || record.status === 'FAILED') return;

    if (record.status === 'RUNNING') {
      record = await this.waitForApifyRun(record);
      if (!record || record.status !== 'PROCESSING') return;
    }

    if (record.status === 'PROCESSING') {
      await this.processPosts(record);
    }
  }

  private async waitForApifyRun(record: InstagramImport): Promise<InstagramImport | null> {
    if (!record.apifyRunId) {
      return this.repository.update(record.id, {
        status: 'FAILED',
        error: 'No se pudo arrancar la corrida de Apify (sin runId)',
        finishedAt: new Date(),
      });
    }

    const deadline = Date.now() + APIFY_POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
      const run = await this.apifyClient.getRunStatus(record.apifyRunId);
      if (run.status === 'SUCCEEDED' && run.datasetId) {
        const items = await this.apifyClient.getDatasetItems(run.datasetId);
        const profile = items.find((i) => i.ownerFullName || i.ownerUsername);
        return this.repository.update(record.id, {
          apifyDatasetId: run.datasetId,
          postsFound: items.length,
          profileName: profile?.ownerFullName || profile?.ownerUsername,
          status: 'PROCESSING',
        });
      }
      if (run.status === 'FAILED' || run.status === 'ABORTED' || run.status === 'TIMED-OUT') {
        return this.repository.update(record.id, {
          status: 'FAILED',
          error: `La corrida de Apify termino en estado ${run.status}`,
          finishedAt: new Date(),
        });
      }
      await sleep(APIFY_POLL_INTERVAL_MS);
    }

    return this.repository.update(record.id, {
      status: 'FAILED',
      error: 'La corrida de Apify no termino a tiempo (timeout de 5 minutos)',
      finishedAt: new Date(),
    });
  }

  private async processPosts(initial: InstagramImport): Promise<void> {
    if (!initial.apifyDatasetId) {
      await this.repository.update(initial.id, {
        status: 'FAILED',
        error: 'Falta el dataset de Apify para procesar posts',
        finishedAt: new Date(),
      });
      return;
    }

    const items = await this.apifyClient.getDatasetItems(initial.apifyDatasetId);
    const store = await this.storeRepository.findByIdWithSubscription(initial.storeId);
    let record = initial;
    let limitReached = false;

    for (let i = record.postsProcessed; i < items.length; i++) {
      let outcome: 'created' | 'skipped';
      if (limitReached) {
        outcome = 'skipped';
      } else {
        try {
          const result = await this.processPost.execute(record.storeId, record.id, items[i]);
          if (result === 'limit') {
            limitReached = true;
            outcome = 'skipped';
          } else {
            outcome = result;
          }
        } catch (err) {
          this.logger.warn(`Post ${i} del import ${record.id} fallo: ${(err as Error).message}`);
          outcome = 'skipped';
        }
      }

      record = await this.repository.update(record.id, {
        postsProcessed: i + 1,
        postsSkipped: outcome === 'skipped' ? record.postsSkipped + 1 : record.postsSkipped,
        productsCreated: outcome === 'created' ? record.productsCreated + 1 : record.productsCreated,
      });
    }

    await this.repository.update(record.id, { status: 'DONE', finishedAt: new Date() });
    // Limpia el pill "importando" del store — el banner del dashboard pasa a
    // consultar el endpoint de estado de este import.
    if (store) {
      await this.storeRepository.update(record.storeId, { instagramImportRequestedAt: null });
    }
  }
}
