import { ForbiddenException } from '@nestjs/common';
import { Plan } from '@prisma/client';
import { CreateAdditionalStoreUseCase } from './create-additional-store.use-case';

/**
 * BE-127 — Tests unitarios de plan gating + side-effect de activeStoreId.
 *
 * Cubre:
 *  - FREE con 0 stores: permite crear, setea como activo.
 *  - FREE con 1 store: 403 con mensaje upgrade PRO.
 *  - PRO con 2 stores: permite crear, setea como activo.
 *  - PRO con 3 stores: 403 con mensaje upgrade BUSINESS.
 *  - BUSINESS con 10 stores: permite crear, setea como activo.
 *  - User con activeStoreId previo: la nueva tienda lo sobreescribe.
 */
describe('CreateAdditionalStoreUseCase', () => {
  const sampleStoreResponse = {
    id: 'store-new',
    slug: 'tienda-nueva',
    name: 'Tienda Nueva',
    // ...campos extra omitidos en el mock; el use-case solo lee `id`.
  } as any;

  function buildHarness(opts: {
    existingStores: Array<{ id: string; plan: Plan | null }>;
    previousActiveStoreId?: string | null;
  }) {
    const findMany = jest.fn().mockResolvedValue(
      opts.existingStores.map((s) => ({
        id: s.id,
        subscription: s.plan ? { plan: s.plan } : null,
      })),
    );
    const userUpdate = jest.fn().mockResolvedValue({
      activeStoreId: 'store-new',
    });

    const prisma = {
      store: { findMany },
      user: { update: userUpdate },
    } as any;

    const createStoreUseCase = {
      execute: jest.fn().mockResolvedValue(sampleStoreResponse),
    } as any;

    const useCase = new CreateAdditionalStoreUseCase(prisma, createStoreUseCase);

    return { useCase, prisma, createStoreUseCase, findMany, userUpdate };
  }

  const dto = { name: 'Tienda Nueva' } as any;

  it('FREE con 0 stores — crea y setea como activo', async () => {
    const { useCase, createStoreUseCase, userUpdate } = buildHarness({
      existingStores: [],
    });

    const result = await useCase.execute('user-1', dto);

    expect(createStoreUseCase.execute).toHaveBeenCalledWith('user-1', dto);
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { activeStoreId: 'store-new' },
    });
    expect(result).toEqual({
      store: sampleStoreResponse,
      activeStoreId: 'store-new',
    });
  });

  it('FREE con 1 store — 403 con mensaje upgrade PRO', async () => {
    const { useCase, createStoreUseCase, userUpdate } = buildHarness({
      existingStores: [{ id: 'store-1', plan: Plan.FREE }],
    });

    await expect(useCase.execute('user-1', dto)).rejects.toMatchObject({
      constructor: ForbiddenException,
    });
    await expect(useCase.execute('user-1', dto)).rejects.toThrow(/PRO/);

    expect(createStoreUseCase.execute).not.toHaveBeenCalled();
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it('PRO con 2 stores — crea y setea como activo', async () => {
    const { useCase, createStoreUseCase, userUpdate } = buildHarness({
      existingStores: [
        { id: 'store-1', plan: Plan.PRO },
        { id: 'store-2', plan: Plan.FREE }, // plan efectivo = max(PRO, FREE) = PRO
      ],
    });

    const result = await useCase.execute('user-1', dto);

    expect(createStoreUseCase.execute).toHaveBeenCalledWith('user-1', dto);
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { activeStoreId: 'store-new' },
    });
    expect(result.activeStoreId).toBe('store-new');
  });

  it('PRO con 3 stores — 403 con mensaje upgrade BUSINESS', async () => {
    const { useCase, createStoreUseCase, userUpdate } = buildHarness({
      existingStores: [
        { id: 'store-1', plan: Plan.PRO },
        { id: 'store-2', plan: Plan.PRO },
        { id: 'store-3', plan: Plan.PRO },
      ],
    });

    await expect(useCase.execute('user-1', dto)).rejects.toMatchObject({
      constructor: ForbiddenException,
    });
    await expect(useCase.execute('user-1', dto)).rejects.toThrow(/BUSINESS/);

    expect(createStoreUseCase.execute).not.toHaveBeenCalled();
    expect(userUpdate).not.toHaveBeenCalled();
  });

  it('BUSINESS con 10 stores — crea y setea como activo (sin limite)', async () => {
    const { useCase, createStoreUseCase, userUpdate } = buildHarness({
      existingStores: Array.from({ length: 10 }, (_, i) => ({
        id: `store-${i}`,
        plan: i === 0 ? Plan.BUSINESS : Plan.PRO,
      })),
    });

    const result = await useCase.execute('user-1', dto);

    expect(createStoreUseCase.execute).toHaveBeenCalled();
    expect(userUpdate).toHaveBeenCalled();
    expect(result.activeStoreId).toBe('store-new');
  });

  it('User con activeStoreId previo — la nueva tienda lo sobreescribe', async () => {
    const { useCase, userUpdate } = buildHarness({
      existingStores: [{ id: 'store-existing', plan: Plan.PRO }],
      previousActiveStoreId: 'store-existing',
    });

    const result = await useCase.execute('user-1', dto);

    // El update reescribe activeStoreId al recien creado.
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { activeStoreId: 'store-new' },
    });
    expect(result.activeStoreId).toBe('store-new');
  });

  it('User sin subscription en sus stores existentes — fallback FREE bloquea creacion adicional', async () => {
    // Edge case: store sin subscription persistida (no deberia ocurrir en
    // produccion porque CreateStoreUseCase la crea, pero el helper debe
    // ser robusto). Se trata como FREE.
    const { useCase, createStoreUseCase } = buildHarness({
      existingStores: [{ id: 'store-broken', plan: null }],
    });

    await expect(useCase.execute('user-1', dto)).rejects.toThrow(
      ForbiddenException,
    );
    expect(createStoreUseCase.execute).not.toHaveBeenCalled();
  });
});
