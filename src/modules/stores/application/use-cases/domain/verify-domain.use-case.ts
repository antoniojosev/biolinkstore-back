import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { StoreDomainStatus } from '@prisma/client';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { IStoreDomainRepository } from '../../../domain/repositories/store-domain.repository.interface';
import { DomainValidatorService } from '../../../domain/services/domain-validator.service';
import { IDnsTxtResolver } from '../../../domain/services/dns-txt-resolver.interface';
import { StoreDomainResponseDto } from '../../dto/store-domain.dto';

@Injectable()
export class VerifyDomainUseCase {
  private readonly logger = new Logger(VerifyDomainUseCase.name);

  constructor(
    @Inject(INJECTION_TOKENS.STORE_DOMAIN_REPOSITORY)
    private readonly domainRepository: IStoreDomainRepository,
    @Inject(INJECTION_TOKENS.DNS_TXT_RESOLVER)
    private readonly dnsResolver: IDnsTxtResolver,
    private readonly prisma: PrismaService,
  ) {}

  async execute(storeId: string): Promise<StoreDomainResponseDto> {
    const row = await this.domainRepository.findByStoreId(storeId);
    if (!row) {
      throw new NotFoundException('Store has no custom domain configured');
    }

    const verificationHost = DomainValidatorService.verificationHost(row.domain);
    const now = new Date();

    let nextStatus: StoreDomainStatus = StoreDomainStatus.PENDING;
    try {
      const records = await this.dnsResolver.resolveTxt(verificationHost);
      const matched = records.some((r) => r.trim() === row.verificationToken);
      nextStatus = matched ? StoreDomainStatus.VERIFIED : StoreDomainStatus.FAILED;
    } catch (e) {
      // Hard DNS error → FAILED so the merchant retries; surface in lastCheckedAt.
      this.logger.warn(
        `verify-domain DNS error for ${verificationHost}: ${(e as Error).message}`,
      );
      nextStatus = StoreDomainStatus.FAILED;
    }

    const updated = await this.domainRepository.update(row.id, {
      status: nextStatus,
      lastCheckedAt: now,
      verifiedAt: nextStatus === StoreDomainStatus.VERIFIED ? now : row.verifiedAt,
    });

    // Sync the legacy Store.customDomain / domainVerified columns when verified
    // so existing code paths (e.g. middleware / OG generation) keep working.
    if (nextStatus === StoreDomainStatus.VERIFIED) {
      await this.prisma.store.update({
        where: { id: storeId },
        data: { customDomain: row.domain, domainVerified: true },
      });
    } else if (nextStatus === StoreDomainStatus.FAILED) {
      await this.prisma.store.update({
        where: { id: storeId },
        data: { domainVerified: false },
      });
    }

    return {
      id: updated.id,
      domain: updated.domain,
      status: updated.status,
      verificationToken: updated.verificationToken,
      verificationHost,
      verifiedAt: updated.verifiedAt,
      lastCheckedAt: updated.lastCheckedAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
