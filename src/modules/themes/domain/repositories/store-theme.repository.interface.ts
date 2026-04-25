import { StoreTheme } from '../entities/store-theme.entity';

/**
 * Repositorio de StoreTheme.
 *
 * BE-120a expuso solo el read mínimo. BE-120b agrega lazy-create y mutaciones
 * de draft (tokens, sections, multi-template switching). Los métodos de
 * publish/rollback llegan en BE-120c sin reorganizar el módulo.
 */
export interface IStoreThemeRepository {
  findByStoreId(storeId: string): Promise<StoreTheme | null>;

  /**
   * Encuentra el theme del store o lo crea con los defaults indicados.
   * Implementación atómica (upsert) — si dos requests simultáneos llaman a la vez,
   * solo uno crea y ambos obtienen una entidad consistente.
   */
  findByStoreIdOrCreate(
    storeId: string,
    defaults: {
      activeTemplate: string;
      draftsByTemplate: Record<string, unknown>;
    },
  ): Promise<StoreTheme>;

  /**
   * Actualiza el draft del template indicado dentro de `draftsByTemplate`.
   * Replace completo de `tokens` para ese template; respeta el resto de la estructura.
   */
  updateDraftTokens(
    storeId: string,
    templateKey: string,
    draftsByTemplate: Record<string, unknown>,
  ): Promise<StoreTheme>;

  /**
   * Actualiza el árbol de secciones (tree) del draft del template indicado dentro
   * de `draftsByTemplate`. Replace completo del tree para ese template.
   */
  updateDraftSections(
    storeId: string,
    templateKey: string,
    draftsByTemplate: Record<string, unknown>,
  ): Promise<StoreTheme>;

  /**
   * Actualiza simultáneamente `draftsByTemplate` y `activeTemplate`.
   * Usado por switch-template (multi-draft FIFO + activeTemplate change). Atómico.
   */
  updateDraftsByTemplateAndActive(
    storeId: string,
    draftsByTemplate: Record<string, unknown>,
    activeTemplate: string,
  ): Promise<StoreTheme>;

  /**
   * Publica el draft del template indicado:
   *   - Snapshot del actual published → rollback (si había published).
   *   - Promueve el draft del template indicado → published.
   *   - Bumpea version y publishedAt = now.
   *   - NO toca el draft (sigue editable).
   *
   * Atomicidad: la operación se ejecuta dentro de una transacción para
   * garantizar que no quedemos en un estado parcial (rollback huérfano sin
   * published, etc.).
   */
  publish(
    storeId: string,
    params: {
      publishedTemplate: string;
      publishedTree: unknown;
      publishedTokens: unknown;
      rollbackTemplate: string | null;
      rollbackTree: unknown | null;
      rollbackTokens: unknown | null;
      publishedAt: Date;
      version: number;
    },
  ): Promise<StoreTheme>;

  /**
   * Swap atómico published ↔ rollback. NO toca drafts ni activeTemplate.
   * `publishedAt` se actualiza a `now` (acabamos de re-publicar la versión vieja).
   * NO incrementa version.
   */
  swapRollback(
    storeId: string,
    params: {
      publishedTemplate: string;
      publishedTree: unknown;
      publishedTokens: unknown;
      rollbackTemplate: string | null;
      rollbackTree: unknown | null;
      rollbackTokens: unknown | null;
      publishedAt: Date;
    },
  ): Promise<StoreTheme>;
}
