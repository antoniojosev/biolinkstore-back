import { Store } from '@/modules/stores/domain/entities/store.entity';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';

/**
 * BE-122: resolves a public store by slug, then by verified custom domain.
 * Returns null if neither matches. Centralized so all public use cases share the
 * same lookup semantics.
 */
export async function resolvePublicStore(
  storeRepository: IStoreRepository,
  slugOrDomain: string,
): Promise<Store | null> {
  const bySlug = await storeRepository.findBySlug(slugOrDomain);
  if (bySlug) return bySlug;
  return storeRepository.findByVerifiedCustomDomain(slugOrDomain);
}
