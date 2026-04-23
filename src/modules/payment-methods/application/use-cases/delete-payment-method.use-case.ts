import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IPaymentMethodRepository } from '../../domain/repositories/payment-method.repository.interface';

@Injectable()
export class DeletePaymentMethodUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.PAYMENT_METHOD_REPOSITORY)
    private readonly repo: IPaymentMethodRepository,
  ) {}

  async execute(storeId: string, id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Metodo no encontrado');
    if (existing.storeId !== storeId) throw new ForbiddenException('Metodo de otra tienda');
    await this.repo.delete(id);
  }
}
