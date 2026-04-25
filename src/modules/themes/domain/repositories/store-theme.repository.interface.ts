import { StoreTheme } from '../entities/store-theme.entity';

/**
 * Repositorio de StoreTheme.
 *
 * BE-120a solo expone consultas mínimas que el catalogo público necesita
 * (ninguna por ahora). Los métodos de mutación (draft/publish/rollback)
 * llegan en BE-120b/c. La interfaz queda definida aquí para que los próximos
 * sub-tickets agreguen métodos sin tocar el contenedor de inyección.
 */
export interface IStoreThemeRepository {
  findByStoreId(storeId: string): Promise<StoreTheme | null>;
}
