import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreDomainRepository } from '../../../domain/repositories/store-domain.repository.interface';
import { DomainValidatorService } from '../../../domain/services/domain-validator.service';
import { StoreDomainResponseDto } from '../../dto/store-domain.dto';

@Injectable()
export class GetDomainUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_DOMAIN_REPOSITORY)
    private readonly domainRepository: IStoreDomainRepository,
  ) {}

  async execute(storeId: string): Promise<StoreDomainResponseDto> {
    const row = await this.domainRepository.findByStoreId(storeId);
    if (!row) {
      throw new NotFoundException('Store has no custom domain configured');
    }
    return {
      id: row.id,
      domain: row.domain,
      status: row.status,
      verificationToken: row.verificationToken,
      verificationHost: DomainValidatorService.verificationHost(row.domain),
      verifiedAt: row.verifiedAt,
      lastCheckedAt: row.lastCheckedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
