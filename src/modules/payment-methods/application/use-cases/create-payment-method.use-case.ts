import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { IPaymentMethodRepository } from '../../domain/repositories/payment-method.repository.interface';
import { StorePaymentMethod, PaymentMethodType } from '../../domain/entities/payment-method.entity';
import { CreatePaymentMethodDto } from '../dto/payment-method.dto';
import { validatePaymentMethodDetails } from '../validate-details.util';
import { enforcePaymentMethodPlanLimit } from '../validate-plan-limits.util';

@Injectable()
export class CreatePaymentMethodUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.PAYMENT_METHOD_REPOSITORY)
    private readonly repo: IPaymentMethodRepository,
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepo: IStoreRepository,
  ) {}

  async execute(storeId: string, dto: CreatePaymentMethodDto): Promise<StorePaymentMethod> {
    const store = await this.storeRepo.findByIdWithSubscription(storeId);
    if (!store) throw new NotFoundException('Tienda no encontrada');

    const plan = store.subscription?.plan ?? 'FREE';
    const currentCount = await this.repo.countByStoreId(storeId);
    enforcePaymentMethodPlanLimit(plan, currentCount);

    validatePaymentMethodDetails(dto.type as PaymentMethodType, dto.details);

    return this.repo.create({
      storeId,
      type: dto.type as PaymentMethodType,
      label: dto.label,
      details: dto.details,
      instructions: dto.instructions ?? null,
      enabled: dto.enabled ?? true,
      displayOrder: dto.displayOrder ?? 0,
    });
  }
}
