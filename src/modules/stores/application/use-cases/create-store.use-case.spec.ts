import { Plan, StoreMemberRole, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { IStoreRepository } from '../../domain/repositories/store.repository.interface';
import { CreateStoreUseCase } from './create-store.use-case';

type TxClient = {
  store: { create: jest.Mock; findUnique: jest.Mock };
  subscription: { create: jest.Mock };
  storeMember: { create: jest.Mock };
};

function buildPrisma(tx: TxClient, existingStores: Array<{ subscription: { plan: Plan } | null }> = []) {
  return {
    $transaction: jest.fn(async (cb: (t: TxClient) => Promise<unknown>) => cb(tx)),
    store: {
      findMany: jest.fn().mockResolvedValue(existingStores),
    },
  } as unknown as PrismaService;
}

function buildTx(persistedStore: Record<string, unknown>): TxClient {
  const created = { id: 'store_new', ...persistedStore, subscription: null };
  const final = { ...created, subscription: { plan: Plan.FREE, status: SubscriptionStatus.ACTIVE } };
  return {
    store: {
      create: jest.fn().mockResolvedValue(created),
      findUnique: jest.fn().mockResolvedValue(final),
    },
    subscription: { create: jest.fn().mockResolvedValue(undefined) },
    storeMember: { create: jest.fn().mockResolvedValue(undefined) },
  };
}

const storeRepoStub = {} as IStoreRepository;

describe('CreateStoreUseCase — BE-131 OWNER auto-creation', () => {
  it('creates a StoreMember row with role OWNER for the creator', async () => {
    const tx = buildTx({
      slug: 'demo-store',
      username: 'demo-store',
      name: 'Demo',
      ownerId: 'user_1',
    });
    const prisma = buildPrisma(tx);
    const useCase = new CreateStoreUseCase(storeRepoStub, prisma);

    await useCase.execute('user_1', {
      name: 'Demo',
      username: 'demo-store',
    });

    expect(tx.storeMember.create).toHaveBeenCalledTimes(1);
    expect(tx.storeMember.create).toHaveBeenCalledWith({
      data: {
        storeId: 'store_new',
        userId: 'user_1',
        role: StoreMemberRole.OWNER,
        invitedBy: null,
      },
    });
  });

  it('creates the OWNER row inside the same transaction as the store + subscription', async () => {
    const tx = buildTx({ slug: 'x', name: 'X', ownerId: 'user_1' });
    const prisma = buildPrisma(tx);
    const useCase = new CreateStoreUseCase(storeRepoStub, prisma);

    await useCase.execute('user_1', { name: 'X', username: 'x' });

    // store.create runs first, then subscription.create, then storeMember.create — all on the same tx client
    const storeOrder = (tx.store.create as jest.Mock).mock.invocationCallOrder[0];
    const subOrder = (tx.subscription.create as jest.Mock).mock.invocationCallOrder[0];
    const memberOrder = (tx.storeMember.create as jest.Mock).mock.invocationCallOrder[0];
    expect(storeOrder).toBeLessThan(subOrder);
    expect(subOrder).toBeLessThan(memberOrder);
  });

  it('falls back to a random slug when username is not provided', async () => {
    const tx = buildTx({ slug: '', name: 'No Name', ownerId: 'user_1' });
    const prisma = buildPrisma(tx);
    const useCase = new CreateStoreUseCase(storeRepoStub, prisma);

    await useCase.execute('user_1', { name: 'No Name' });

    const slugUsed = (tx.store.create as jest.Mock).mock.calls[0][0].data.slug;
    expect(slugUsed).toHaveLength(16);
    expect(slugUsed).toMatch(/^[0-9a-f]+$/);
  });

  it('does not call $transaction nor create the OWNER row when the plan-gate rejects', async () => {
    // FREE plan with 1 existing store → store-limit.helper throws Forbidden
    const tx = buildTx({ slug: 'x', name: 'X', ownerId: 'user_1' });
    const prisma = buildPrisma(tx, [{ subscription: { plan: Plan.FREE } }]);
    const useCase = new CreateStoreUseCase(storeRepoStub, prisma);

    await expect(useCase.execute('user_1', { name: 'X', username: 'x' })).rejects.toBeDefined();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.storeMember.create).not.toHaveBeenCalled();
  });
});
