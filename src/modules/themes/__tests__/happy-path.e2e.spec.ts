/**
 * Suite 1 — Happy path completo del editor del page builder.
 *
 * Flujo:
 *   GET theme (lazy create) → PATCH tokens → PATCH sections → publish (1ra vez)
 *   → PATCH tokens → publish (2da, debe llenar rollback) → rollback (swap)
 *   → GET público (devuelve el rollback ahora "republicado").
 */

import * as request from 'supertest';
import { Plan } from '@prisma/client';

import {
  TestEnv,
  createInMemoryThemesEnv,
  seedTemplate,
} from './test-env';

describe('Themes E2E — Happy path completo', () => {
  let env: TestEnv;

  beforeEach(async () => {
    env = await createInMemoryThemesEnv();
    seedTemplate(env, 'vitrina', { planRequired: Plan.FREE });
  });

  afterEach(async () => {
    await env.app.close();
  });

  it('lazy-create + edición + 2 publishes + rollback + GET público', async () => {
    const http = env.app.getHttpServer();

    // ── 1. GET inicial: lazy-create con vitrina + draft inicial ────────────
    const r1 = await request(http)
      .get(`/stores/${env.storeId}/theme`)
      .expect(200);

    expect(r1.body.activeTemplate).toBe('vitrina');
    expect(r1.body.publishedTemplate).toBeNull();
    expect(r1.body.rollbackTemplate).toBeNull();
    expect(r1.body.version).toBe(1);
    expect(r1.body.draft.template).toBe('vitrina');
    expect(r1.body.draft.tokens).toHaveProperty('palette.primary');
    expect(r1.body.drafts).toHaveLength(1);
    expect(r1.body.drafts[0].template).toBe('vitrina');

    // ── 2. PATCH tokens: cambiar primary; el resto se conserva ─────────────
    const initialSecondary =
      r1.body.draft.tokens.palette.secondary;

    const r2 = await request(http)
      .patch(`/stores/${env.storeId}/theme/draft/tokens`)
      .send({ tokens: { palette: { primary: '#ff0000' } } })
      .expect(200);

    expect(r2.body.draft.tokens.palette.primary).toBe('#ff0000');
    // El resto de la palette se mantiene gracias al deep merge.
    expect(r2.body.draft.tokens.palette.secondary).toBe(initialSecondary);
    expect(r2.body.draft.tokens.palette.bg).toBe(
      r1.body.draft.tokens.palette.bg,
    );
    // Tokens fuera de palette intactos.
    expect(r2.body.draft.tokens.typography).toEqual(
      r1.body.draft.tokens.typography,
    );

    // ── 3. PATCH sections: aplicar árbol válido ────────────────────────────
    const r3 = await request(http)
      .patch(`/stores/${env.storeId}/theme/draft/sections`)
      .send({
        sections: [
          {
            type: 'hero',
            key: 'hero_main',
            visible: true,
            props: { headline: 'Bienvenido', ctaLabel: 'Ver más' },
          },
        ],
      })
      .expect(200);

    expect(r3.body.draft.tree.sections).toHaveLength(1);
    expect(r3.body.draft.tree.sections[0]).toMatchObject({
      type: 'hero',
      key: 'hero_main',
      visible: true,
      props: { headline: 'Bienvenido', ctaLabel: 'Ver más' },
    });

    // ── 4. publish (1ra vez) → published = draft, rollback = null, ver=2 ───
    const r4 = await request(http)
      .post(`/stores/${env.storeId}/theme/publish`)
      .expect(200);

    expect(r4.body.publishedTemplate).toBe('vitrina');
    expect(r4.body.rollbackTemplate).toBeNull();
    expect(r4.body.version).toBe(2);
    expect(r4.body.published).not.toBeNull();
    expect(r4.body.published.tokens.palette.primary).toBe('#ff0000');
    expect(r4.body.published.tree.sections[0].props.headline).toBe(
      'Bienvenido',
    );
    expect(r4.body.publishedAt).toBeTruthy();
    // El draft sigue siendo editable.
    expect(r4.body.draft.tokens.palette.primary).toBe('#ff0000');

    // ── 5. PATCH tokens otra vez (cambio distinto) ─────────────────────────
    const r5 = await request(http)
      .patch(`/stores/${env.storeId}/theme/draft/tokens`)
      .send({ tokens: { palette: { primary: '#00ff00' } } })
      .expect(200);

    expect(r5.body.draft.tokens.palette.primary).toBe('#00ff00');
    // El published mantiene el valor anterior.
    expect(r5.body.published.tokens.palette.primary).toBe('#ff0000');

    // ── 6. publish (2da) → published nuevo + rollback con anterior ─────────
    const r6 = await request(http)
      .post(`/stores/${env.storeId}/theme/publish`)
      .expect(200);

    expect(r6.body.publishedTemplate).toBe('vitrina');
    expect(r6.body.rollbackTemplate).toBe('vitrina');
    expect(r6.body.version).toBe(3);
    expect(r6.body.published.tokens.palette.primary).toBe('#00ff00');
    expect(r6.body.rollback).not.toBeNull();
    expect(r6.body.rollback.tokens.palette.primary).toBe('#ff0000');

    // ── 7. rollback → swap published ↔ rollback, version sin tocar ─────────
    const r7 = await request(http)
      .post(`/stores/${env.storeId}/theme/rollback`)
      .expect(200);

    expect(r7.body.publishedTemplate).toBe('vitrina');
    expect(r7.body.rollbackTemplate).toBe('vitrina');
    expect(r7.body.version).toBe(3); // NO cambia
    expect(r7.body.published.tokens.palette.primary).toBe('#ff0000'); // anterior published volvió
    expect(r7.body.rollback.tokens.palette.primary).toBe('#00ff00'); // último published bajó a rollback

    // ── 8. GET público devuelve el "nuevo" published (post-rollback) ───────
    const r8 = await request(http).get('/public/mi-tienda/theme').expect(200);

    expect(r8.body.template).toBe('vitrina');
    expect(r8.body.tokens.palette.primary).toBe('#ff0000');
    expect(r8.body.tree.sections[0].props.headline).toBe('Bienvenido');
    expect(r8.body.version).toBe(3);
  });
});
