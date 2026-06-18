import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Plan, SubscriptionStatus } from '@prisma/client';
import { Store } from '@/modules/stores/domain/entities/store.entity';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { IPaymentMethodRepository } from '../../domain/repositories/payment-method.repository.interface';
import { StorePaymentMethod } from '../../domain/entities/payment-method.entity';
import { PaymentMethodTypeDto } from '../dto/payment-method.dto';
import { CreatePaymentMethodUseCase } from './create-payment-method.use-case';

function makeStore(plan: Plan | null): Store {
  return new Store({
    id: 'store_1',
    slug: 'demo',
    username: null,
    name: 'Demo',
    description: null,
    logo: null,
    favicon: null,
    banner: null,
    primaryColor: '#000',
    secondaryColor: '#fff',
    backgroundColor: '#fff',
    textColor: '#000',
    font: 'Inter',
    template: 'vitrina',
    whatsappNumbers: [],
    instagramHandle: null,
    facebookUrl: null,
    tiktokUrl: null,
    email: null,
    phone: null,
    address: null,
    socialLinks: null,
    businessHours: null,
    checkoutConfig: null,
    currencyConfig: null,
    whatsappTemplate: null,
    stockEnabled: false,
    showBranding: true,
    customDomain: null,
    domainVerified: false,
    ctaType: 'WHATSAPP',
    ctaLabel: null,
    ctaUrl: null,
    aboutShort: null,
    aboutLong: null,
    locationLat: null,
    locationLng: null,
    locationLabel: null,
    ownerId: 'owner_1',
    subscription: plan
      ? { plan, status: SubscriptionStatus.ACTIVE }
      : undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildPmRepo(): jest.Mocked<IPaymentMethodRepository> {
  return {
    findById: jest.fn(),
    findByStoreId: jest.fn(),
    countByStoreId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

function buildStoreRepo(): jest.Mocked<IStoreRepository> {
  return {
    findById: jest.fn(),
    findByIdWithSubscription: jest.fn(),
    findBySlug: jest.fn(),
    findByVerifiedCustomDomain: jest.fn(),
    findByOwnerId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    checkSlugExists: jest.fn(),
    checkUsernameExists: jest.fn(),
  };
}

const validZelleDto = {
  type: PaymentMethodTypeDto.ZELLE,
  label: 'Zelle USA',
  details: { email: 'pay@example.com', holderName: 'María Demo' },
};

describe('CreatePaymentMethodUseCase', () => {
  it('throws 404 when the store does not exist', async () => {
    const pmRepo = buildPmRepo();
    const storeRepo = buildStoreRepo();
    storeRepo.findByIdWithSubscription.mockResolvedValue(null);

    const useCase = new CreatePaymentMethodUseCase(pmRepo, storeRepo);

    await expect(useCase.execute('missing', validZelleDto)).rejects.toBeInstanceOf(NotFoundException);
    expect(pmRepo.create).not.toHaveBeenCalled();
  });

  it('allows FREE store to create its first payment method (count=0)', async () => {
    const pmRepo = buildPmRepo();
    const storeRepo = buildStoreRepo();
    storeRepo.findByIdWithSubscription.mockResolvedValue(makeStore(Plan.FREE));
    pmRepo.countByStoreId.mockResolvedValue(0);
    pmRepo.create.mockResolvedValue(
      new StorePaymentMethod({
        id: 'pm_1',
        storeId: 'store_1',
        type: 'ZELLE',
        label: 'Zelle USA',
        details: validZelleDto.details,
        instructions: null,
        enabled: true,
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    const useCase = new CreatePaymentMethodUseCase(pmRepo, storeRepo);
    const result = await useCase.execute('store_1', validZelleDto);

    expect(result.id).toBe('pm_1');
    expect(pmRepo.create).toHaveBeenCalled();
  });

  it('blocks FREE store at the limit (count=1)', async () => {
    const pmRepo = buildPmRepo();
    const storeRepo = buildStoreRepo();
    storeRepo.findByIdWithSubscription.mockResolvedValue(makeStore(Plan.FREE));
    pmRepo.countByStoreId.mockResolvedValue(1);

    const useCase = new CreatePaymentMethodUseCase(pmRepo, storeRepo);

    await expect(useCase.execute('store_1', validZelleDto)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(pmRepo.create).not.toHaveBeenCalled();
  });

  it('allows PRO store unlimited payment methods (count=20)', async () => {
    const pmRepo = buildPmRepo();
    const storeRepo = buildStoreRepo();
    storeRepo.findByIdWithSubscription.mockResolvedValue(makeStore(Plan.PRO));
    pmRepo.countByStoreId.mockResolvedValue(20);
    pmRepo.create.mockResolvedValue(
      new StorePaymentMethod({ id: 'pm_n' } as Partial<StorePaymentMethod>),
    );

    const useCase = new CreatePaymentMethodUseCase(pmRepo, storeRepo);
    await expect(useCase.execute('store_1', validZelleDto)).resolves.toBeDefined();
  });

  it('falls back to FREE when the store has no subscription record', async () => {
    const pmRepo = buildPmRepo();
    const storeRepo = buildStoreRepo();
    storeRepo.findByIdWithSubscription.mockResolvedValue(makeStore(null));
    pmRepo.countByStoreId.mockResolvedValue(1);

    const useCase = new CreatePaymentMethodUseCase(pmRepo, storeRepo);

    await expect(useCase.execute('store_1', validZelleDto)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('runs plan-gate BEFORE details validation (cheaper check first)', async () => {
    const pmRepo = buildPmRepo();
    const storeRepo = buildStoreRepo();
    storeRepo.findByIdWithSubscription.mockResolvedValue(makeStore(Plan.FREE));
    pmRepo.countByStoreId.mockResolvedValue(1);

    const useCase = new CreatePaymentMethodUseCase(pmRepo, storeRepo);

    // DTO with invalid Zelle details (missing holderName). Plan-gate should
    // fire 403 first and the BadRequest validator should never run.
    await expect(
      useCase.execute('store_1', {
        type: PaymentMethodTypeDto.ZELLE,
        label: 'X',
        details: { email: 'only-email@x.com' },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws 400 when details are invalid for the chosen type', async () => {
    const pmRepo = buildPmRepo();
    const storeRepo = buildStoreRepo();
    storeRepo.findByIdWithSubscription.mockResolvedValue(makeStore(Plan.PRO));
    pmRepo.countByStoreId.mockResolvedValue(0);

    const useCase = new CreatePaymentMethodUseCase(pmRepo, storeRepo);

    await expect(
      useCase.execute('store_1', {
        type: PaymentMethodTypeDto.PAGO_MOVIL,
        label: 'Pago Movil',
        details: { phone: '+58' }, // missing idNumber + bank
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(pmRepo.create).not.toHaveBeenCalled();
  });

  it('defaults instructions=null, enabled=true, displayOrder=0 when not provided', async () => {
    const pmRepo = buildPmRepo();
    const storeRepo = buildStoreRepo();
    storeRepo.findByIdWithSubscription.mockResolvedValue(makeStore(Plan.PRO));
    pmRepo.countByStoreId.mockResolvedValue(0);
    pmRepo.create.mockResolvedValue(
      new StorePaymentMethod({ id: 'pm_x' } as Partial<StorePaymentMethod>),
    );

    const useCase = new CreatePaymentMethodUseCase(pmRepo, storeRepo);
    await useCase.execute('store_1', validZelleDto);

    expect(pmRepo.create.mock.calls[0][0]).toMatchObject({
      storeId: 'store_1',
      type: 'ZELLE',
      instructions: null,
      enabled: true,
      displayOrder: 0,
    });
  });
});
