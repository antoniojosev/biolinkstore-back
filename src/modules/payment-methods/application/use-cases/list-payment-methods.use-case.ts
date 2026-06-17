import { Injectable, Inject } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IPaymentMethodRepository } from '../../domain/repositories/payment-method.repository.interface';
import { StorePaymentMethod } from '../../domain/entities/payment-method.entity';

@Injectable()
export class ListPaymentMethodsUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.PAYMENT_METHOD_REPOSITORY)
    private readonly repo: IPaymentMethodRepository,
  ) {}

  execute(storeId: string): Promise<StorePaymentMethod[]> {
    return this.repo.findByStoreId(storeId);
  }
}
