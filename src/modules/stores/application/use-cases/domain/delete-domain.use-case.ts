import { Inject, Injectable } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { IStoreDomainRepository } from '../../../domain/repositories/store-domain.repository.interface';

@Injectable()
export class DeleteDomainUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_DOMAIN_REPOSITORY)
    private readonly domainRepository: IStoreDomainRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(storeId: string): Promise<void> {
    await this.domainRepository.deleteByStoreId(storeId);
    await this.prisma.store.update({
      where: { id: storeId },
      data: { customDomain: null, domainVerified: false },
    });
  }
}
