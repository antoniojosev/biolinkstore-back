import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IPaymentMethodRepository } from '../../domain/repositories/payment-method.repository.interface';
import { StorePaymentMethod, PaymentMethodType } from '../../domain/entities/payment-method.entity';
import { UpdatePaymentMethodDto } from '../dto/payment-method.dto';
import { validatePaymentMethodDetails } from '../validate-details.util';

@Injectable()
export class UpdatePaymentMethodUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.PAYMENT_METHOD_REPOSITORY)
    private readonly repo: IPaymentMethodRepository,
  ) {}

  async execute(
    storeId: string,
    id: string,
    dto: UpdatePaymentMethodDto,
  ): Promise<StorePaymentMethod> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Metodo no encontrado');
    if (existing.storeId !== storeId) throw new ForbiddenException('Metodo de otra tienda');

    const effectiveType = (dto.type ?? existing.type) as PaymentMethodType;
    if (dto.details !== undefined || dto.type !== undefined) {
      const effectiveDetails = dto.details ?? existing.details;
      validatePaymentMethodDetails(effectiveType, effectiveDetails);
    }

    return this.repo.update(id, {
      ...(dto.type !== undefined && { type: dto.type as PaymentMethodType }),
      ...(dto.label !== undefined && { label: dto.label }),
      ...(dto.details !== undefined && { details: dto.details }),
      ...(dto.instructions !== undefined && { instructions: dto.instructions }),
      ...(dto.enabled !== undefined && { enabled: dto.enabled }),
      ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
    });
  }
}
