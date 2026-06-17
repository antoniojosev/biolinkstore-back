/**
 * GetStoreRealDataHelper — BE-120d.
 *
 * Carga la "data real" del store que el preview con datos reales necesita:
 *   - Store (id, name, slug, logo, banner, phone, address, email, socials).
 *     Solo lee columnas que ya existen en el schema actual; campos opcionales
 *     futuros (BE-123 aboutShort/aboutLong/locationLat/locationLng/locationLabel)
 *     se exponen únicamente si la entidad los trae (forward-compatible).
 *   - Productos visibles del store (limit configurable, default 20),
 *     ordenados por sortOrder asc → updatedAt desc fallback (lo que el repo
 *     ya soporta vía sortBy/sortOrder).
 *   - Categorías visibles del store (limit equivalente).
 *
 * Reglas:
 *   - SOLO lee. Nunca escribe a DB.
 *   - 404 explícito si el store no existe (NotFoundException).
 *   - Robusto a `socialLinks=null` y campos opcionales ausentes.
 *   - Reusa repos existentes vía sus interfaces de dominio.
 *
 * NO se inyecta como provider de Nest. Es un servicio puro stateless cuya única
 * dependencia son los 3 repos pasados por constructor; lo registra el use case
 * en el provider tree para que se inyecte ahí.
 */

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { IProductRepository } from '@/modules/products/domain/repositories/product.repository.interface';
import { ICategoryRepository } from '@/modules/categories/domain/repositories/category.repository.interface';
import { Store, StoreSocialLinks } from '@/modules/stores/domain/entities/store.entity';
import { Product } from '@/modules/products/domain/entities/product.entity';
import { Category } from '@/modules/categories/domain/entities/category.entity';

export interface RealStoreSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  socials: StoreSocialLinks | null;
}

export interface RealStoreData {
  store: RealStoreSummary;
  products: Product[];
  categories: Category[];
}

const DEFAULT_PRODUCT_LIMIT = 20;
const DEFAULT_CATEGORY_LIMIT = 100;

@Injectable()
export class GetStoreRealDataHelper {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepo: IStoreRepository,
    @Inject(INJECTION_TOKENS.PRODUCT_REPOSITORY)
    private readonly productRepo: IProductRepository,
    @Inject(INJECTION_TOKENS.CATEGORY_REPOSITORY)
    private readonly categoryRepo: ICategoryRepository,
  ) {}

  async execute(
    storeId: string,
    productLimit: number = DEFAULT_PRODUCT_LIMIT,
  ): Promise<RealStoreData> {
    const store = await this.storeRepo.findById(storeId);
    if (!store) {
      throw new NotFoundException(`Store not found: ${storeId}`);
    }

    // Lecturas paralelas — son lecturas independientes en tablas distintas.
    const [productsResult, categoriesResult] = await Promise.all([
      this.productRepo.findByStoreId(storeId, {
        page: 1,
        limit: productLimit,
        isVisible: true,
        sortBy: 'sortOrder',
        sortOrder: 'asc',
      }),
      this.categoryRepo.findByStoreId(storeId, {
        page: 1,
        limit: DEFAULT_CATEGORY_LIMIT,
        sortBy: 'sortOrder',
        sortOrder: 'asc',
      }),
    ]);

    return {
      store: this.toSummary(store),
      products: productsResult.data,
      // El repo de categorías no filtra por isVisible en findByStoreId; lo
      // hacemos en aplicación para preservar el contrato "preview muestra solo
      // visibles" sin tocar el repo en este ticket.
      categories: categoriesResult.data.filter((c) => c.isVisible),
    };
  }

  private toSummary(store: Store): RealStoreSummary {
    return {
      id: store.id,
      slug: store.slug,
      name: store.name,
      description: store.description ?? null,
      logo: store.logo ?? null,
      banner: store.banner ?? null,
      phone: store.phone ?? null,
      email: store.email ?? null,
      address: store.address ?? null,
      socials: store.socialLinks ?? null,
    };
  }
}
