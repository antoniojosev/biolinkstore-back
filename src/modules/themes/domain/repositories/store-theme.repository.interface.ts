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
}
