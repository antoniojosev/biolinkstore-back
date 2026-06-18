/**
 * Suite 6 — Preview dual.
 *
 *   1. Store sin productos + GET preview (autenticado) → mode='demo-fallback',
 *      productos del demoData del template.
 *   2. Store con productos + GET preview → mode='live', productos reales.
 *   3. GET preview?template=atelier cuando active=vitrina → preview de atelier
 *      con plan check (caemos solo si el store tiene plan).
 *   4. GET /public/templates/:key/preview → 404 si template no existe.
 *   5. GET /public/templates/:key/preview → 200 con demo data si existe.
 */

import * as request from 'supertest';
import { Plan } from '@prisma/client';

import {
  TestEnv,
  createInMemoryThemesEnv,
  seedTemplate,
  setStorePlan,
} from './test-env';
import { Product } from '@/modules/products/domain/entities/product.entity';
import { Category } from '@/modules/categories/domain/entities/category.entity';

describe('Themes E2E — Preview dual', () => {
  let env: TestEnv;

  beforeEach(async () => {
    env = await createInMemoryThemesEnv();
    seedTemplate(env, 'vitrina', {
      planRequired: Plan.FREE,
      demoDataJson: {
        store: { name: 'Demo Vitrina' },
        products: [
          { id: 'demo_p1', name: 'Demo Vitrina P1', basePrice: 100 },
          { id: 'demo_p2', name: 'Demo Vitrina P2', basePrice: 200 },
        ],
        categories: [{ id: 'demo_c1', name: 'Demo Cat 1' }],
      },
    });
  });

  afterEach(async () => {
    await env.app.close();
  });

  it('1. Store sin productos → mode="demo-fallback"', async () => {
    const http = env.app.getHttpServer();

    const r = await request(http)
      .get(`/stores/${env.storeId}/theme/preview`)
      .expect(200);

    expect(r.body.mode).toBe('demo-fallback');
    expect(r.body.template).toBe('vitrina');
    expect(r.body.products).toHaveLength(2);
    expect(r.body.products[0]).toMatchObject({ id: 'demo_p1' });
  });

  it('2. Store con productos → mode="live"', async () => {
    env.productRepo.add(
      env.storeId,
      new Product({
        id: 'p_real_1',
        storeId: env.storeId,
        name: 'Producto real 1',
        slug: 'producto-real-1',
        tagline: null,
        description: null,
        basePrice: 50,
        compareAtPrice: null,
        images: [],
        videos: [],
        stock: 10,
        sku: null,
        isVisible: true,
        isFeatured: false,
        isOnSale: false,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    const http = env.app.getHttpServer();
    const r = await request(http)
      .get(`/stores/${env.storeId}/theme/preview`)
      .expect(200);

    expect(r.body.mode).toBe('live');
    expect(r.body.products).toHaveLength(1);
    expect(r.body.products[0].id).toBe('p_real_1');
  });

  it('2b. categorías reales coexisten con productos reales', async () => {
    env.productRepo.add(
      env.storeId,
      new Product({
        id: 'p_x',
        storeId: env.storeId,
        name: 'Real',
        slug: 'real',
        tagline: null,
        description: null,
        basePrice: 1,
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
      }),
    );
    env.categoryRepo.add(
      env.storeId,
      new Category({
        id: 'c_x',
        storeId: env.storeId,
        name: 'Cat real',
        slug: 'cat-real',
        description: null,
        image: null,
        isVisible: true,
        sortOrder: 0,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    const r = await request(env.app.getHttpServer())
      .get(`/stores/${env.storeId}/theme/preview`)
      .expect(200);

    expect(r.body.mode).toBe('live');
    expect(r.body.categories).toHaveLength(1);
    expect(r.body.categories[0].id).toBe('c_x');
  });

  it('3. GET preview?template=atelier cuando active=vitrina → atelier (con plan)', async () => {
    seedTemplate(env, 'atelier', {
      planRequired: Plan.PRO,
      demoDataJson: {
        store: { name: 'Demo Atelier' },
        products: [{ id: 'atelier_demo_1', name: 'Atelier demo' }],
        categories: [],
      },
    });
    setStorePlan(env, Plan.PRO);

    // Lazy-create activo en vitrina.
    await request(env.app.getHttpServer())
      .get(`/stores/${env.storeId}/theme`)
      .expect(200);

    const r = await request(env.app.getHttpServer())
      .get(`/stores/${env.storeId}/theme/preview`)
      .query({ template: 'atelier' })
      .expect(200);

    expect(r.body.template).toBe('atelier');
    expect(r.body.isActiveTemplate).toBe(false);
    expect(r.body.products[0].id).toBe('atelier_demo_1');
  });

  it('3b. GET preview?template=atelier sin plan PRO → 403', async () => {
    seedTemplate(env, 'atelier', { planRequired: Plan.PRO });
    // Plan default = FREE (no setPlan llamado).

    await request(env.app.getHttpServer())
      .get(`/stores/${env.storeId}/theme/preview`)
      .query({ template: 'atelier' })
      .expect(403);
  });

  it('4. GET /public/templates/:key/preview → 404 si no existe', async () => {
    await request(env.app.getHttpServer())
      .get('/public/templates/no-existe/preview')
      .expect(404);
  });

  it('5. GET /public/templates/:key/preview → 200 con demo data', async () => {
    const r = await request(env.app.getHttpServer())
      .get('/public/templates/vitrina/preview')
      .expect(200);

    expect(r.body.template).toBe('vitrina');
    expect(r.body.demoData).toBeDefined();
    expect((r.body.demoData as { products: unknown[] }).products).toHaveLength(2);
    expect(r.body.tree).toBeDefined();
    expect(r.body.tokens).toBeDefined();
  });
});
