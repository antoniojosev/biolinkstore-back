/**
 * Suite 4 — Validación de schema en PATCH sections.
 *
 * Reglas que ejerce esta suite:
 *   1. Section.type desconocido → ignorada silenciosamente (no error).
 *   2. Section.key duplicado → 400.
 *   3. Prop tipo inválido (number donde va string) → 400.
 *   4. Props desconocidas → ignoradas (lenient).
 *   5. List con max excedido → 400.
 */

import * as request from 'supertest';
import { Plan } from '@prisma/client';

import {
  TestEnv,
  createInMemoryThemesEnv,
  seedTemplate,
} from './test-env';

describe('Themes E2E — Validación PATCH sections', () => {
  let env: TestEnv;

  beforeEach(async () => {
    env = await createInMemoryThemesEnv();
    seedTemplate(env, 'vitrina', {
      planRequired: Plan.FREE,
      sectionSchema: {
        defaultOrder: ['hero_main'],
        sections: [
          {
            type: 'hero',
            key: 'hero_main',
            props: {
              headline: { type: 'text', max: 80 },
              ctaLabel: { type: 'text', max: 24 },
            },
          },
          {
            type: 'socials',
            key: 'socials_bar',
            props: {
              items: {
                type: 'list',
                max: 3,
                itemSchema: {
                  platform: {
                    type: 'enum',
                    options: ['IG', 'TIKTOK', 'FACEBOOK'],
                  },
                  url: { type: 'string' },
                },
              },
            },
          },
        ],
      },
    });
    // Lazy create previo a las mutaciones.
  });

  afterEach(async () => {
    await env.app.close();
  });

  async function lazyCreate(): Promise<void> {
    await request(env.app.getHttpServer())
      .get(`/stores/${env.storeId}/theme`)
      .expect(200);
  }

  it('section.type desconocido al schema → ignorada silenciosamente', async () => {
    await lazyCreate();
    const http = env.app.getHttpServer();

    const r = await request(http)
      .patch(`/stores/${env.storeId}/theme/draft/sections`)
      .send({
        sections: [
          {
            type: 'hero',
            key: 'hero_main',
            visible: true,
            props: { headline: 'Hola' },
          },
          {
            // Este type no existe en sectionSchema.sections — debe descartarse.
            type: 'no_existe',
            key: 'random_1',
            visible: true,
            props: {},
          },
        ],
      })
      .expect(200);

    expect(r.body.draft.tree.sections).toHaveLength(1);
    expect(r.body.draft.tree.sections[0].type).toBe('hero');
  });

  it('section.key duplicado → 400', async () => {
    await lazyCreate();
    const http = env.app.getHttpServer();

    const r = await request(http)
      .patch(`/stores/${env.storeId}/theme/draft/sections`)
      .send({
        sections: [
          {
            type: 'hero',
            key: 'hero_main',
            visible: true,
            props: { headline: 'Uno' },
          },
          {
            type: 'hero',
            key: 'hero_main',
            visible: true,
            props: { headline: 'Dos' },
          },
        ],
      })
      .expect(400);

    // El HttpExceptionFilter aplana el body a { statusCode, message, error, ... }
    // y descarta el array `errors` detallado. Nos basta con el message y el
    // statusCode 400 para verificar el rechazo de validación.
    expect(r.body.statusCode).toBe(400);
    expect(r.body.message).toContain('Section validation');
  });

  it('prop con tipo inválido (number donde va string) → 400', async () => {
    await lazyCreate();
    const http = env.app.getHttpServer();

    const r = await request(http)
      .patch(`/stores/${env.storeId}/theme/draft/sections`)
      .send({
        sections: [
          {
            type: 'hero',
            key: 'hero_main',
            visible: true,
            props: {
              // headline declarado como text → string. Mandamos number.
              headline: 12345,
            },
          },
        ],
      })
      .expect(400);

    expect(r.body.statusCode).toBe(400);
    expect(r.body.message).toContain('Section validation');
  });

  it('props desconocidas → ignoradas, sección persistida sin esas props', async () => {
    await lazyCreate();
    const http = env.app.getHttpServer();

    const r = await request(http)
      .patch(`/stores/${env.storeId}/theme/draft/sections`)
      .send({
        sections: [
          {
            type: 'hero',
            key: 'hero_main',
            visible: true,
            props: {
              headline: 'Bienvenido',
              prop_loca_no_existe: 'algo random',
              otro_random: 99,
            },
          },
        ],
      })
      .expect(200);

    const persistedProps = r.body.draft.tree.sections[0].props;
    expect(persistedProps).toEqual({ headline: 'Bienvenido' });
    expect(persistedProps).not.toHaveProperty('prop_loca_no_existe');
    expect(persistedProps).not.toHaveProperty('otro_random');
  });

  it('list con max excedido → 400', async () => {
    await lazyCreate();
    const http = env.app.getHttpServer();

    // socials_bar.items tiene max=3. Mandamos 4 items.
    const r = await request(http)
      .patch(`/stores/${env.storeId}/theme/draft/sections`)
      .send({
        sections: [
          {
            type: 'hero',
            key: 'hero_main',
            visible: true,
            props: { headline: 'Hola' },
          },
          {
            type: 'socials',
            key: 'socials_bar',
            visible: true,
            props: {
              items: [
                { platform: 'IG', url: 'https://instagram.com/a' },
                { platform: 'TIKTOK', url: 'https://tiktok.com/b' },
                { platform: 'FACEBOOK', url: 'https://facebook.com/c' },
                { platform: 'IG', url: 'https://instagram.com/d' },
              ],
            },
          },
        ],
      })
      .expect(400);

    expect(r.body.statusCode).toBe(400);
    expect(r.body.message).toContain('Section validation');
  });
});
