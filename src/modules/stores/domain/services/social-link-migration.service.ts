import { SocialPlatform } from '@prisma/client';
import { StoreSocialLinks } from '../entities/store.entity';
import { CreateStoreSocialLinkData } from '../repositories/store-social-link.repository.interface';

const PLATFORM_MAP: Record<keyof StoreSocialLinks, SocialPlatform> = {
  instagram: SocialPlatform.IG,
  tiktok: SocialPlatform.TIKTOK,
  facebook: SocialPlatform.FACEBOOK,
  twitter: SocialPlatform.TWITTER,
  whatsapp: SocialPlatform.WHATSAPP,
};

/**
 * Build seed rows for a freshly migrating store from the legacy JSON column.
 * - Skips empty/whitespace-only values.
 * - Only emits keys present in the legacy JSON.
 * - sortOrder follows declaration order in PLATFORM_MAP.
 */
export function buildSocialLinkRowsFromLegacyJson(
  storeId: string,
  legacy: StoreSocialLinks | null | undefined,
): CreateStoreSocialLinkData[] {
  if (!legacy) return [];

  const rows: CreateStoreSocialLinkData[] = [];
  let index = 0;

  for (const key of Object.keys(PLATFORM_MAP) as Array<keyof StoreSocialLinks>) {
    const value = legacy[key];
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed.length === 0) continue;
    rows.push({
      storeId,
      platform: PLATFORM_MAP[key],
      url: trimmed,
      label: null,
      sortOrder: index,
      visible: true,
    });
    index += 1;
  }

  return rows;
}
