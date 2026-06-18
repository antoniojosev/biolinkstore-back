import { NotFoundException } from '@nestjs/common';
import { Store } from '@/modules/stores/domain/entities/store.entity';
import { Product } from '@/modules/products/domain/entities/product.entity';
import { Category } from '@/modules/categories/domain/entities/category.entity';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { IProductRepository } from '@/modules/products/domain/repositories/product.repository.interface';
import { ICategoryRepository } from '@/modules/categories/domain/repositories/category.repository.interface';
import { GetStoreRealDataHelper } from './get-store-real-data.helper';

function buildStore(overrides: Partial<Store> = {}): Store {
  return new Store({
    id: 'store_1',
    slug: 'mi-tienda',
    username: null,
    name: 'Mi Tienda',
    description: 'Descripción',
    logo: 'r2://logo.png',
    favicon: null,
    banner: 'r2://banner.png',
    primaryColor: '#000',
    secondaryColor: '#fff',
    backgroundColor: '#fff',
    textColor: '#000',
    font: 'Inter',
    template: 'vitrina',
    whatsappNumbers: ['+58000'],
    instagramHandle: null,
    facebookUrl: null,
    tiktokUrl: null,
    email: 'a@b.com',
    phone: '+58000',
    address: 'Caracas',
    socialLinks: { instagram: 'https://instagram.com/x' },
    businessHours: null,
    checkoutConfig: null,
    currencyConfig: null,
    whatsappTemplate: null,
    stockEnabled: true,
    showBranding: true,
    customDomain: null,
    domainVerified: false,
    ownerId: 'owner_1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function buildProduct(id: string, overrides: Partial<Product> = {}): Product {
  return new Product({
    id,
    storeId: 'store_1',
    name: `Producto ${id}`,
    slug: `producto-${id}`,
    tagline: null,
    description: null,
    basePrice: 10,
    compareAtPrice: null,
    images: [],
    videos: [],
    stock: null,
    sku: null,
    isVisible: true,
    isFeatured: false,
    isOnSale: false,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function buildCategory(
  id: string,
  isVisible: boolean,
  overrides: Partial<Category> = {},
): Category {
  return new Category({
    id,
    storeId: 'store_1',
    name: `Categoría ${id}`,
    slug: `categoria-${id}`,
    description: null,
    image: null,
    isVisible,
    sortOrder: 0,
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

interface MockSetup {
  store: Store | null;
  products: Product[];
  categories: Category[];
}

function buildMocks(setup: MockSetup) {
  const productCalls: unknown[] = [];

  const storeRepo: IStoreRepository = {
    findById: jest.fn(async () => setup.store),
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

  const productRepo: IProductRepository = {
    findById: jest.fn(),
    findBySlug: jest.fn(),
    findByStoreId: jest.fn(async (storeId, params) => {
      productCalls.push({ storeId, params });
      return {
        data: setup.products,
        meta: {
          total: setup.products.length,
          page: 1,
          limit: params?.limit ?? 20,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    checkSlugExists: jest.fn(),
    countByStoreId: jest.fn(),
  };

  const categoryRepo: ICategoryRepository = {
    findById: jest.fn(),
    findBySlug: jest.fn(),
    findByStoreId: jest.fn(async () => ({
      data: setup.categories,
      meta: {
        total: setup.categories.length,
        page: 1,
        limit: 100,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    })),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    checkSlugExists: jest.fn(),
  };

  return {
    helper: new GetStoreRealDataHelper(storeRepo, productRepo, categoryRepo),
    productCalls,
  };
}

describe('GetStoreRealDataHelper', () => {
  it('404 cuando store no existe', async () => {
    const { helper } = buildMocks({ store: null, products: [], categories: [] });
    await expect(helper.execute('store_1')).rejects.toThrow(NotFoundException);
  });

  it('happy path con productos y categorías visibles + summary del store correcto', async () => {
    const products = [buildProduct('p1'), buildProduct('p2')];
    const categories = [
      buildCategory('c1', true),
      buildCategory('c2', false), // oculta — debe filtrarse
      buildCategory('c3', true),
    ];

    const { helper, productCalls } = buildMocks({
      store: buildStore(),
      products,
      categories,
    });

    const out = await helper.execute('store_1');

    expect(out.store).toEqual({
      id: 'store_1',
      slug: 'mi-tienda',
      name: 'Mi Tienda',
      description: 'Descripción',
      logo: 'r2://logo.png',
      banner: 'r2://banner.png',
      phone: '+58000',
      email: 'a@b.com',
      address: 'Caracas',
      socials: { instagram: 'https://instagram.com/x' },
    });
    expect(out.products).toEqual(products);
    expect(out.categories.map((c) => c.id)).toEqual(['c1', 'c3']);

    // Verifica params al productRepo: isVisible=true, sortBy=sortOrder, limit default.
    expect(productCalls).toHaveLength(1);
    const call = productCalls[0] as { params: Record<string, unknown> };
    expect(call.params.isVisible).toBe(true);
    expect(call.params.sortBy).toBe('sortOrder');
    expect(call.params.sortOrder).toBe('asc');
    expect(call.params.limit).toBe(20);
  });

  it('store sin productos visibles: array vacío en products (no fallback aquí — eso lo hace el use case)', async () => {
    const { helper } = buildMocks({
      store: buildStore(),
      products: [],
      categories: [buildCategory('c1', true)],
    });

    const out = await helper.execute('store_1');
    expect(out.products).toEqual([]);
    expect(out.categories).toHaveLength(1);
  });

  it('respeta productLimit personalizado', async () => {
    const { helper, productCalls } = buildMocks({
      store: buildStore(),
      products: [],
      categories: [],
    });
    await helper.execute('store_1', 5);
    const call = productCalls[0] as { params: Record<string, unknown> };
    expect(call.params.limit).toBe(5);
  });

  it('socials=null cuando store.socialLinks es null (campo opcional)', async () => {
    const { helper } = buildMocks({
      store: buildStore({ socialLinks: null, phone: null, email: null, address: null }),
      products: [],
      categories: [],
    });
    const out = await helper.execute('store_1');
    expect(out.store.socials).toBeNull();
    expect(out.store.phone).toBeNull();
    expect(out.store.email).toBeNull();
    expect(out.store.address).toBeNull();
  });
});
