import {
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Plan } from '@prisma/client';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { IRateRepository } from '../../domain/repositories/rate.repository.interface';
import { FormulaParserService } from '../../domain/services/formula-parser.service';
import { UpdateCustomRateDto } from '../dto/custom-rate.dto';
import { CustomRateMode, StoreCustomRate } from '../../domain/entities/rate.entity';
import { enforcePlanAndModeRules } from './validate-plan-limits.util';

@Injectable()
export class UpdateCustomRateUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepo: IStoreRepository,
    @Inject(INJECTION_TOKENS.RATE_REPOSITORY)
    private readonly rateRepo: IRateRepository,
    private readonly parser: FormulaParserService,
  ) {}

  async execute(
    storeId: string,
    id: string,
    dto: UpdateCustomRateDto,
  ): Promise<StoreCustomRate> {
    const existing = await this.rateRepo.findCustomById(id);
    if (!existing) throw new NotFoundException('Custom rate not found');
    if (existing.storeId !== storeId) {
      throw new ForbiddenException('Custom rate does not belong to this store');
    }

    const store = await this.storeRepo.findByIdWithSubscription(storeId);
    if (!store) throw new NotFoundException('Store not found');
    const plan = store.subscription?.plan ?? Plan.FREE;

    const mode: CustomRateMode = (dto.mode ?? existing.mode) as CustomRateMode;
    const hasValueVes = dto.valueVes !== undefined ? dto.valueVes != null : existing.valueVes != null;
    const hasFormula = dto.formula !== undefined ? !!dto.formula : !!existing.formula;
    const hasSourceUrl = dto.sourceUrl !== undefined ? !!dto.sourceUrl : !!existing.sourceUrl;
    const hasSourcePath = dto.sourcePath !== undefined ? !!dto.sourcePath : !!existing.sourcePath;

    const storeCustoms = await this.rateRepo.findCustomsByStore(storeId);
    enforcePlanAndModeRules({
      plan,
      mode,
      existing: storeCustoms,
      excludeId: id,
      hasValueVes,
      hasFormula,
      hasSourceUrl,
      hasSourcePath,
    });

    const nextFormula = dto.formula !== undefined ? dto.formula : existing.formula;
    if (mode === 'FORMULA' && nextFormula) {
      try {
        this.parser.validate(nextFormula);
      } catch (err) {
        throw new BadRequestException((err as Error).message);
      }
    }

    const patch = {
      ...(dto.label !== undefined ? { label: dto.label } : {}),
      ...(dto.baseCurrency !== undefined ? { baseCurrency: dto.baseCurrency } : {}),
      ...(dto.mode !== undefined ? { mode } : {}),
      valueVes: mode === 'MANUAL' ? (dto.valueVes ?? existing.valueVes) : null,
      formula: mode === 'FORMULA' ? (nextFormula ?? null) : null,
      sourceUrl: mode === 'API' ? (dto.sourceUrl ?? existing.sourceUrl) : null,
      sourcePath: mode === 'API' ? (dto.sourcePath ?? existing.sourcePath) : null,
    };

    return this.rateRepo.updateCustom(id, patch);
  }
}
