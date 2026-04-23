import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Plan } from '@prisma/client';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { IRateRepository } from '../../domain/repositories/rate.repository.interface';
import { FormulaParserService } from '../../domain/services/formula-parser.service';
import { CreateCustomRateDto } from '../dto/custom-rate.dto';
import { StoreCustomRate } from '../../domain/entities/rate.entity';
import { enforcePlanAndModeRules } from './validate-plan-limits.util';

@Injectable()
export class CreateCustomRateUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepo: IStoreRepository,
    @Inject(INJECTION_TOKENS.RATE_REPOSITORY)
    private readonly rateRepo: IRateRepository,
    private readonly parser: FormulaParserService,
  ) {}

  async execute(storeId: string, dto: CreateCustomRateDto): Promise<StoreCustomRate> {
    const store = await this.storeRepo.findByIdWithSubscription(storeId);
    if (!store) throw new NotFoundException('Store not found');

    const plan = store.subscription?.plan ?? Plan.FREE;
    const existing = await this.rateRepo.findCustomsByStore(storeId);

    enforcePlanAndModeRules({
      plan,
      mode: dto.mode,
      existing,
      hasValueVes: dto.valueVes != null,
      hasFormula: !!dto.formula,
      hasSourceUrl: !!dto.sourceUrl,
      hasSourcePath: !!dto.sourcePath,
    });

    if (dto.mode === 'FORMULA' && dto.formula) {
      try {
        this.parser.validate(dto.formula);
      } catch (err) {
        throw new BadRequestException((err as Error).message);
      }
    }

    return this.rateRepo.createCustom({
      storeId,
      label: dto.label,
      baseCurrency: dto.baseCurrency,
      mode: dto.mode,
      valueVes: dto.mode === 'MANUAL' ? dto.valueVes : null,
      formula: dto.mode === 'FORMULA' ? dto.formula : null,
      sourceUrl: dto.mode === 'API' ? dto.sourceUrl : null,
      sourcePath: dto.mode === 'API' ? dto.sourcePath : null,
    });
  }
}
