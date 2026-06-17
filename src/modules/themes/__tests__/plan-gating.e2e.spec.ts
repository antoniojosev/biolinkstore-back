/**
 * Suite 3 — Plan gating en switch-template.
 *
 * Reglas:
 *   - FREE store + template PRO ⇒ 403.
 *   - PRO store + template PRO ⇒ 200.
 *   - FREE store + template FREE ⇒ 200.
 */

import * as request from 'supertest';
import { Plan } from '@prisma/client';

import {
  TestEnv,
  createInMemoryThemesEnv,
  seedTemplate,
  setStorePlan,
} from './test-env';

describe('Themes E2E — Plan gating en switch-template', () => {
  let env: TestEnv;

  beforeEach(async () => {
    env = await createInMemoryThemesEnv();
    seedTemplate(env, 'vitrina', { planRequired: Plan.FREE });
    seedTemplate(env, 'noir', { planRequired: Plan.PRO });
  });

  afterEach(async () => {
    await env.app.close();
  });

  it('FREE store no puede switchear a noir (PRO) → 403', async () => {
    // Plan por defecto es FREE (no se setea subscription).
    const http = env.app.getHttpServer();

    // Lazy create primero (con vitrina).
    await request(http).get(`/stores/${env.storeId}/theme`).expect(200);

    const r = await request(http)
      .post(`/stores/${env.storeId}/theme/switch-template`)
      .send({ templateKey: 'noir' })
      .expect(403);

    expect(r.body.message).toContain('PRO');
  });

  it('PRO store puede switchear a noir → 200', async () => {
    setStorePlan(env, Plan.PRO);
    const http = env.app.getHttpServer();

    await request(http).get(`/stores/${env.storeId}/theme`).expect(200);

    const r = await request(http)
      .post(`/stores/${env.storeId}/theme/switch-template`)
      .send({ templateKey: 'noir' })
      .expect(200);

    expect(r.body.activeTemplate).toBe('noir');
  });

  it('FREE store puede switchear a vitrina (FREE) → 200', async () => {
    seedTemplate(env, 'menu', { planRequired: Plan.FREE });
    const http = env.app.getHttpServer();

    // Lazy create con vitrina, switch a menu (otro FREE), después de vuelta a vitrina.
    await request(http).get(`/stores/${env.storeId}/theme`).expect(200);
    await request(http)
      .post(`/stores/${env.storeId}/theme/switch-template`)
      .send({ templateKey: 'menu' })
      .expect(200);

    const r = await request(http)
      .post(`/stores/${env.storeId}/theme/switch-template`)
      .send({ templateKey: 'vitrina' })
      .expect(200);

    expect(r.body.activeTemplate).toBe('vitrina');
  });
});
