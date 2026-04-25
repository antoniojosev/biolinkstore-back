/**
 * Suite 2 — Multi-draft FIFO max 3.
 *
 * Validamos que `draftsByTemplate` mantiene como máximo 3 entradas no-published
 * y que el más antiguo se purga al agregar el 4to. El template publicado NO
 * cuenta hacia el límite.
 */

import * as request from 'supertest';
import { Plan } from '@prisma/client';

import {
  TestEnv,
  createInMemoryThemesEnv,
  seedTemplate,
  seedTheme,
} from './test-env';

describe('Themes E2E — Multi-draft FIFO', () => {
  let env: TestEnv;

  beforeEach(async () => {
    env = await createInMemoryThemesEnv();
    // Cuatro templates FREE para probar la rotación sin tocar plan-gating.
    seedTemplate(env, 'vitrina', { planRequired: Plan.FREE, sortOrder: 0 });
    seedTemplate(env, 'luxora', { planRequired: Plan.FREE, sortOrder: 1 });
    seedTemplate(env, 'noir', { planRequired: Plan.FREE, sortOrder: 2 });
    seedTemplate(env, 'menu', { planRequired: Plan.FREE, sortOrder: 3 });
  });

  afterEach(async () => {
    await env.app.close();
  });

  it('purga el draft más antiguo cuando se agrega el 4to template (sin published)', async () => {
    const http = env.app.getHttpServer();

    // 1. Lazy create con vitrina (1 draft).
    const r1 = await request(http)
      .get(`/stores/${env.storeId}/theme`)
      .expect(200);
    expect(r1.body.drafts).toHaveLength(1);
    expect(r1.body.drafts[0].template).toBe('vitrina');

    // 2. Switch a luxora (2 drafts). Pequeño delay para que updatedAt sea distinto.
    await sleep(5);
    const r2 = await request(http)
      .post(`/stores/${env.storeId}/theme/switch-template`)
      .send({ templateKey: 'luxora' })
      .expect(200);
    expect(r2.body.activeTemplate).toBe('luxora');
    expect(sortedDraftKeys(r2.body.drafts)).toEqual(['luxora', 'vitrina']);

    // 3. Switch a noir (3 drafts).
    await sleep(5);
    const r3 = await request(http)
      .post(`/stores/${env.storeId}/theme/switch-template`)
      .send({ templateKey: 'noir' })
      .expect(200);
    expect(sortedDraftKeys(r3.body.drafts)).toEqual([
      'luxora',
      'noir',
      'vitrina',
    ]);

    // 4. Switch a menu (4to). vitrina tiene el updatedAt más viejo y nada
    //    está publicado, debería ser purgada.
    await sleep(5);
    const r4 = await request(http)
      .post(`/stores/${env.storeId}/theme/switch-template`)
      .send({ templateKey: 'menu' })
      .expect(200);

    // 5. Verificar exactamente las 3 entradas esperadas.
    const finalKeys = sortedDraftKeys(r4.body.drafts);
    expect(finalKeys).toHaveLength(3);
    expect(finalKeys).toEqual(['luxora', 'menu', 'noir']);
    expect(r4.body.activeTemplate).toBe('menu');
  });

  it('si hay published, NO se purga aunque haya 4 entradas en draftsByTemplate', async () => {
    // Setup directo: theme con vitrina como published + 3 drafts no-published
    // ya pre-existentes (luxora, noir, menu), y vamos a añadir un 5to (digamos
    // un template extra "atelier") — debería purgar el más antiguo NO-published
    // y el published (vitrina) seguir intacto en el set.
    seedTemplate(env, 'atelier', { planRequired: Plan.FREE, sortOrder: 4 });

    const baseTime = Date.parse('2026-04-01T00:00:00Z');
    const draftAt = (offset: number) =>
      new Date(baseTime + offset).toISOString();

    seedTheme(env, {
      activeTemplate: 'menu',
      publishedTemplate: 'vitrina',
      publishedTree: {
        template: 'vitrina',
        templateVersion: 1,
        sections: [],
      },
      publishedTokens: { palette: { primary: '#000' } },
      draftsByTemplate: {
        // vitrina = published (no cuenta para purga)
        vitrina: {
          tree: { template: 'vitrina', templateVersion: 1, sections: [] },
          tokens: { palette: { primary: '#000' } },
          updatedAt: draftAt(1000),
        },
        luxora: {
          tree: { template: 'luxora', templateVersion: 1, sections: [] },
          tokens: { palette: { primary: '#aaa' } },
          updatedAt: draftAt(5000), // más antiguo de los no-published después
        },
        noir: {
          tree: { template: 'noir', templateVersion: 1, sections: [] },
          tokens: { palette: { primary: '#bbb' } },
          updatedAt: draftAt(10000),
        },
        menu: {
          tree: { template: 'menu', templateVersion: 1, sections: [] },
          tokens: { palette: { primary: '#ccc' } },
          updatedAt: draftAt(20000),
        },
      },
      version: 2,
      publishedAt: new Date(baseTime),
    });

    const http = env.app.getHttpServer();

    // Switch a atelier — son 4 no-published (luxora/noir/menu/atelier nuevo)
    // antes de añadir, el contador es 3 (luxora/noir/menu) y entra atelier:
    // se purga el más antiguo entre [luxora, noir, menu] = luxora.
    const r = await request(http)
      .post(`/stores/${env.storeId}/theme/switch-template`)
      .send({ templateKey: 'atelier' })
      .expect(200);

    const keys = sortedDraftKeys(r.body.drafts);
    // vitrina (published) NO se purga, atelier entra, luxora se va.
    expect(keys).toEqual(['atelier', 'menu', 'noir', 'vitrina']);
    expect(keys).toHaveLength(4);
    expect(r.body.publishedTemplate).toBe('vitrina');
    expect(r.body.activeTemplate).toBe('atelier');
  });
});

function sortedDraftKeys(drafts: Array<{ template: string }>): string[] {
  return drafts.map((d) => d.template).sort();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
