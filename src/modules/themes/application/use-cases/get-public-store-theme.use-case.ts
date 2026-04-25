import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { IStoreThemeRepository } from '../../domain/repositories/store-theme.repository.interface';
import { ITemplateRepository } from '../../domain/repositories/template.repository.interface';
import { Template } from '../../domain/entities/template.entity';
import { PublicStoreThemeDto } from '../dto/public-store-theme-response.dto';
import {
  defaultTokensFor,
  defaultTreeFor,
} from '../services/template-defaults.helper';
import {
  MigratorTree,
  migrateTreeToCurrentVersion,
} from '../services/theme-version-migrator.service';

const DEFAULT_TEMPLATE_KEY = 'vitrina';

/**
 * GET público del theme de una tienda por slug.
 *
 * Resolución de store:
 *   - BE-122 (resolvePublicStore que soporta slug + custom domain) NO está en
 *     esta base. Por ahora resolvemos solo por slug. Cuando BE-122 mergee,
 *     basta con sustituir esta llamada por el helper compartido.
 *
 * Lógica:
 *   1. Resolver store por slug → 404 si no existe.
 *   2. Cargar StoreTheme; si no existe O publishedTree es null → fallback con
 *      template "vitrina" (o primero activo) + defaults. NO escribe en DB.
 *   3. Si existe published → migración lazy al templateVersion actual del
 *      catálogo (en memoria, no persiste).
 */
@Injectable()
export class GetPublicStoreThemeUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepo: IStoreRepository,
    @Inject(INJECTION_TOKENS.STORE_THEME_REPOSITORY)
    private readonly storeThemeRepo: IStoreThemeRepository,
    @Inject(INJECTION_TOKENS.TEMPLATE_REPOSITORY)
    private readonly templateRepo: ITemplateRepository,
  ) {}

  async execute(slug: string): Promise<PublicStoreThemeDto> {
    const store = await this.storeRepo.findBySlug(slug);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const theme = await this.storeThemeRepo.findByStoreId(store.id);

    // Caso fallback: no theme o nunca se publicó.
    if (
      !theme ||
      theme.publishedTree === null ||
      theme.publishedTree === undefined ||
      !theme.publishedTemplate
    ) {
      return this.buildFallback();
    }

    // Migración lazy del tree al templateVersion actual.
    const template = await this.templateRepo.findActiveByKey(
      theme.publishedTemplate,
    );

    let tree = theme.publishedTree as unknown as MigratorTree;

    if (template) {
      // Migración SOLO en memoria — NO persiste (lazy en lectura).
      const result = migrateTreeToCurrentVersion(tree, template);
      tree = result.tree;
    }
    // Si el template ya no está activo en el catálogo, devolvemos el tree tal
    // cual (mejor que romper el público; el dueño puede republicar luego).

    return {
      template: theme.publishedTemplate,
      templateVersion:
        typeof tree?.templateVersion === 'number' ? tree.templateVersion : 0,
      publishedAt: theme.publishedAt ? theme.publishedAt.toISOString() : null,
      version: theme.version,
      tree,
      tokens: theme.publishedTokens,
    };
  }

  private async buildFallback(): Promise<PublicStoreThemeDto> {
    const defaultTpl = await this.resolveFallbackTemplate();
    const tree = defaultTreeFor(defaultTpl);
    const tokens = defaultTokensFor(defaultTpl);

    return {
      template: defaultTpl.key,
      templateVersion: defaultTpl.version,
      publishedAt: null,
      version: 0,
      tree,
      tokens,
    };
  }

  private async resolveFallbackTemplate(): Promise<Template> {
    const vitrina = await this.templateRepo.findActiveByKey(DEFAULT_TEMPLATE_KEY);
    if (vitrina) return vitrina;

    // Fallback secundario: cualquier template activo (no debería pasar en
    // entornos seedados, pero protege contra catálogo vacío).
    const list = await this.templateRepo.findActive({});
    if (list.length === 0) {
      throw new NotFoundException(
        `No active template available (catalog empty)`,
      );
    }
    return list[0];
  }
}
