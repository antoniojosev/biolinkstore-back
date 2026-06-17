/**
 * Suite 5 — Migración lazy de templateVersion en endpoint público.
 *
 * Escenario:
 *   1. Una tienda tiene published con `templateVersion=1`.
 *   2. El catálogo bumpea el template a v2 con una prop nueva (`subheadline`)
 *      declarada con default ("nuevo subhead!").
 *   3. GET /public/:slug/theme → el tree devuelto trae `templateVersion=2`
 *      y la prop nueva con default; PERO la fila en DB sigue intacta
 *      (publishedTree templateVersion=1).
 */

import * as request from 'supertest';
import { Plan } from '@prisma/client';

import {
  TestEnv,
  createInMemoryThemesEnv,
  seedTemplate,
  seedTheme,
} from './test-env';

describe('Themes E2E — Migración lazy de templateVersion en público', () => {
  let env: TestEnv;

  beforeEach(async () => {
    env = await createInMemoryThemesEnv();
  });

  afterEach(async () => {
    await env.app.close();
  });

  it('GET público devuelve el tree migrado a v2; DB no se toca', async () => {
    // 1. Catálogo arranca con vitrina v1, schema sin `subheadline`.
    seedTemplate(env, 'vitrina', {
      planRequired: Plan.FREE,
      version: 1,
      sectionSchema: {
        defaultOrder: ['hero_main'],
        sections: [
          {
            type: 'hero',
            key: 'hero_main',
            props: {
              headline: { type: 'text', max: 80 },
            },
          },
        ],
      },
      defaultTokens: { palette: { primary: '#111111' } },
    });

    // 2. Tienda con published v1 (sin subheadline).
    seedTheme(env, {
      activeTemplate: 'vitrina',
      publishedTemplate: 'vitrina',
      publishedTree: {
        template: 'vitrina',
        templateVersion: 1,
        sections: [
          {
            type: 'hero',
            key: 'hero_main',
            visible: true,
            props: { headline: 'Hola' },
          },
        ],
      },
      publishedTokens: { palette: { primary: '#abcdef' } },
      version: 2,
      publishedAt: new Date('2026-04-01T00:00:00Z'),
    });

    // 3. Bump del template a v2 con una prop nueva con default.
    env.templateRepo.bumpVersion('vitrina', (t) => {
      t.version = 2;
      t.sectionSchema = {
        defaultOrder: ['hero_main'],
        sections: [
          {
            type: 'hero',
            key: 'hero_main',
            props: {
              headline: { type: 'text', max: 80 },
              subheadline: { type: 'text', max: 200 },
            },
            // El migrator usa `defaults` como source para añadir props nuevas.
            defaults: {
              subheadline: 'nuevo subhead!',
            },
          },
        ],
      };
    });

    // 4. Snapshot DEEP de la fila persistida ANTES del GET — para asegurar
    //    que el endpoint NO escribe.
    const persistedBefore = env.themeRepo.raw(env.storeId);
    expect(persistedBefore).toBeDefined();
    const beforeJson = JSON.stringify(persistedBefore!.publishedTree);

    // 5. GET público.
    const r = await request(env.app.getHttpServer())
      .get('/public/mi-tienda/theme')
      .expect(200);

    expect(r.body.template).toBe('vitrina');
    expect(r.body.templateVersion).toBe(2);
    expect(r.body.tree.templateVersion).toBe(2);
    const heroSection = r.body.tree.sections.find(
      (s: { key: string }) => s.key === 'hero_main',
    );
    expect(heroSection).toBeDefined();
    expect(heroSection.props.headline).toBe('Hola');
    expect(heroSection.props.subheadline).toBe('nuevo subhead!');

    // 6. La fila en DB NO se modificó.
    const persistedAfter = env.themeRepo.raw(env.storeId);
    expect(persistedAfter).toBeDefined();
    expect(JSON.stringify(persistedAfter!.publishedTree)).toBe(beforeJson);
    // Verificación adicional: `templateVersion` persistido sigue en 1.
    const tree = persistedAfter!.publishedTree as { templateVersion: number };
    expect(tree.templateVersion).toBe(1);
  });
});
