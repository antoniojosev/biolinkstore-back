import { Store as PrismaStore, Subscription as PrismaSubscription } from '@prisma/client';
import { Store } from '../../domain/entities/store.entity';
import { StoreResponseDto } from '../dto/store-response.dto';

type StoreWithSubscription = PrismaStore & { subscription?: PrismaSubscription | null };

export class StoreMapper {
  static toDomain(prismaStore: StoreWithSubscription): Store {
    return new Store({
      id: prismaStore.id,
      slug: prismaStore.slug,
      username: prismaStore.username,
      name: prismaStore.name,
      description: prismaStore.description,
      logo: prismaStore.logo,
      favicon: prismaStore.favicon,
      banner: prismaStore.banner,
      primaryColor: prismaStore.primaryColor,
      secondaryColor: prismaStore.secondaryColor,
      backgroundColor: prismaStore.backgroundColor,
      textColor: prismaStore.textColor,
      font: prismaStore.font,
      template: prismaStore.template,
      whatsappNumbers: prismaStore.whatsappNumbers,
      instagramHandle: prismaStore.instagramHandle,
      facebookUrl: prismaStore.facebookUrl,
      tiktokUrl: prismaStore.tiktokUrl,
      email: prismaStore.email,
      address: prismaStore.address,
      businessHours: prismaStore.businessHours,
      checkoutConfig: prismaStore.checkoutConfig,
      currencyConfig: prismaStore.currencyConfig,
      stockEnabled: prismaStore.stockEnabled,
      showBranding: prismaStore.showBranding,
      customDomain: prismaStore.customDomain,
      domainVerified: prismaStore.domainVerified,
      ownerId: prismaStore.ownerId,
      subscription: prismaStore.subscription
        ? {
            plan: prismaStore.subscription.plan,
            status: prismaStore.subscription.status,
          }
        : undefined,
      createdAt: prismaStore.createdAt,
      updatedAt: prismaStore.updatedAt,
    });
  }

  static toResponse(store: Store): StoreResponseDto {
    return {
      id: store.id,
      slug: store.slug,
      username: store.username,
      name: store.name,
      description: store.description,
      logo: store.logo,
      favicon: store.favicon,
      banner: store.banner,
      primaryColor: store.primaryColor,
      secondaryColor: store.secondaryColor,
      backgroundColor: store.backgroundColor,
      textColor: store.textColor,
      font: store.font,
      template: store.template,
      whatsappNumbers: store.whatsappNumbers,
      instagramHandle: store.instagramHandle,
      facebookUrl: store.facebookUrl,
      tiktokUrl: store.tiktokUrl,
      email: store.email,
      address: store.address,
      businessHours: store.businessHours,
      checkoutConfig: store.checkoutConfig,
      currencyConfig: store.currencyConfig,
      stockEnabled: store.stockEnabled,
      showBranding: store.showBranding,
      customDomain: store.customDomain,
      domainVerified: store.domainVerified,
      ownerId: store.ownerId,
      subscription: store.subscription,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
    };
  }
}
