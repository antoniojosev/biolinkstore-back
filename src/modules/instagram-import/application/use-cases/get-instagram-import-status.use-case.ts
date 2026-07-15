import { Inject, Injectable } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IInstagramImportRepository } from '../../domain/repositories/instagram-import.repository.interface';
import { InstagramImportMapper } from '../mappers/instagram-import.mapper';
import { InstagramImportStatusDto } from '../dto/instagram-import-status.dto';
import { PollInstagramImportUseCase } from './poll-instagram-import.use-case';

@Injectable()
export class GetInstagramImportStatusUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.INSTAGRAM_IMPORT_REPOSITORY)
    private readonly repository: IInstagramImportRepository,
    private readonly pollUseCase: PollInstagramImportUseCase,
  ) {}

  async execute(storeId: string): Promise<InstagramImportStatusDto | null> {
    const latest = await this.repository.findLatestByStoreId(storeId);
    if (!latest) return null;

    // Resolucion lazy: si quedo RUNNING/PROCESSING y nadie lo esta procesando
    // en este momento (ej. el server se reinicio a mitad de camino), esto lo
    // retoma en background — sin bloquear esta respuesta, que ya muestra el
    // estado actual y se pone al dia en el proximo poll del frontend.
    if (latest.status === 'RUNNING' || latest.status === 'PROCESSING') {
      this.pollUseCase.tryResume(latest.id);
    }

    const products = await this.repository.findCreatedProducts(latest.id);
    return InstagramImportMapper.toStatusDto(latest, products);
  }
}
