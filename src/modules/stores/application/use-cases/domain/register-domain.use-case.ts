import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { IStoreRepository } from '../../../domain/repositories/store.repository.interface';
import { IStoreDomainRepository } from '../../../domain/repositories/store-domain.repository.interface';
import { DomainValidatorService } from '../../../domain/services/domain-validator.service';
import {
  RegisterStoreDomainDto,
  StoreDomainResponseDto,
} from '../../dto/store-domain.dto';
import { assertCustomDomainAllowed } from './_plan-gate.helper';

@Injectable()
export class RegisterDomainUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    @Inject(INJECTION_TOKENS.STORE_DOMAIN_REPOSITORY)
    private readonly domainRepository: IStoreDomainRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    storeId: string,
    dto: RegisterStoreDomainDto,
  ): Promise<StoreDomainResponseDto> {
    const store = await this.storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    await assertCustomDomainAllowed(this.prisma, storeId);

    let normalized: string;
    try {
      normalized = DomainValidatorService.normalizeAndValidate(dto.domain);
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }

    // Conflict if another store owns this domain (verified or pending).
    const existingForDomain = await this.domainRepository.findByDomain(normalized);
    if (existingForDomain && existingForDomain.storeId !== storeId) {
      throw new ConflictException('Domain already registered by another store');
    }

    const verificationToken = DomainValidatorService.generateVerificationToken();

    let row;
    if (existingForDomain && existingForDomain.storeId === storeId) {
      // Same store re-registering same domain → rotate token, reset to PENDING.
      row = await this.domainRepository.update(existingForDomain.id, {
        verificationToken,
        status: 'PENDING',
        verifiedAt: null,
        lastCheckedAt: null,
      });
    } else {
      const existingForStore = await this.domainRepository.findByStoreId(storeId);
      if (existingForStore) {
        // Replacing: update domain + token, reset state.
        row = await this.domainRepository.update(existingForStore.id, {
          domain: normalized,
          verificationToken,
          status: 'PENDING',
          verifiedAt: null,
          lastCheckedAt: null,
        });
      } else {
        row = await this.domainRepository.create({
          storeId,
          domain: normalized,
          verificationToken,
        });
      }
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
