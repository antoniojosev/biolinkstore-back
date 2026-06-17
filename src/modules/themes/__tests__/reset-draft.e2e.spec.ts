/**
 * Suite 7 — Reset draft.
 *
 *   1. PATCH tokens, luego POST reset-draft → draft vuelve a defaultTokens
 *      del template (porque NO hay published para activeTemplate).
 *   2. Si publishedTemplate === activeTemplate y hay published, reset usa
 *      published (NO defaultTokens).
 */

import * as request from 'supertest';
import { Plan } from '@prisma/client';

import {
  TestEnv,
  createInMemoryThemesEnv,
  seedTemplate,
  seedTheme,
} from './test-env';

describe('Themes E2E — Reset draft', () => {
  let env: TestEnv;

  beforeEach(async () => {
    env = await createInMemoryThemesEnv();
    seedTemplate(env, 'vitrina', {
      planRequired: Plan.FREE,
      defaultTokens: {
        palette: {
          primary: '#000111',
          secondary: '#000222',
          bg: '#FFFFFF',
          text: '#0A0A0A',
        },
        typography: { headingFont: 'Inter', bodyFont: 'Inter', scale: 'normal' },
        radius: 'md',
        spacing: 'normal',
        buttonStyle: 'solid',
      },
    });
  });

  afterEach(async () => {
    await env.app.close();
  });

  it('1. Sin published → reset cae a defaultTokens del template', async () => {
    const http = env.app.getHttpServer();

    // Lazy create + cambio de tokens.
    await request(http).get(`/stores/${env.storeId}/theme`).expect(200);
    const r1 = await request(http)
      .patch(`/stores/${env.storeId}/theme/draft/tokens`)
      .send({ tokens: { palette: { primary: '#ff0000' } } })
      .expect(200);
    expect(r1.body.draft.tokens.palette.primary).toBe('#ff0000');

    // Reset.
    const r2 = await request(http)
      .post(`/stores/${env.storeId}/theme/reset-draft`)
      .expect(200);

    expect(r2.body.draft.tokens.palette.primary).toBe('#000111');
    expect(r2.body.draft.tokens.palette.secondary).toBe('#000222');
  });

  it('2. publishedTemplate === activeTemplate y hay published → reset al published, no a defaults', async () => {
    // Setup: published con tokens distintos de defaultTokens.
    seedTheme(env, {
      activeTemplate: 'vitrina',
      publishedTemplate: 'vitrina',
      publishedTree: {
        template: 'vitrina',
        templateVersion: 1,
        sections: [],
      },
      publishedTokens: {
        palette: {
          primary: '#abcdef',
          secondary: '#fedcba',
          bg: '#FFFFFF',
          text: '#000000',
        },
        typography: { headingFont: 'Inter', bodyFont: 'Inter', scale: 'normal' },
        radius: 'md',
        spacing: 'normal',
        buttonStyle: 'solid',
      },
      draftsByTemplate: {
        vitrina: {
          tree: { template: 'vitrina', templateVersion: 1, sections: [] },
          tokens: { palette: { primary: '#999999' } }, // tokens dirty
          updatedAt: new Date('2026-04-20T10:00:00Z').toISOString(),
        },
      },
      version: 2,
      publishedAt: new Date('2026-04-15T00:00:00Z'),
    });

    const r = await request(env.app.getHttpServer())
      .post(`/stores/${env.storeId}/theme/reset-draft`)
      .expect(200);

    // Debe ser el published, no el default.
    expect(r.body.draft.tokens.palette.primary).toBe('#abcdef');
    expect(r.body.draft.tokens.palette.primary).not.toBe('#000111');
  });
});
