import { ForbiddenException } from '@nestjs/common';
import { Plan, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

const ALLOWED_PLANS: Plan[] = [Plan.PRO, Plan.BUSINESS];

/**
 * BE-122: custom domain feature is gated to PRO/BUSINESS active subscriptions.
 * Throws ForbiddenException otherwise.
 */
export async function assertCustomDomainAllowed(
  prisma: PrismaService,
  storeId: string,
): Promise<void> {
  const subscription = await prisma.subscription.findUnique({ where: { storeId } });
  if (!subscription) {
    throw new ForbiddenException('Custom domain requires PRO or BUSINESS plan');
  }
  if (subscription.status !== SubscriptionStatus.ACTIVE && subscription.status !== SubscriptionStatus.TRIALING) {
    throw new ForbiddenException('Subscription is not active');
  }
  if (!ALLOWED_PLANS.includes(subscription.plan)) {
    throw new ForbiddenException('Custom domain requires PRO or BUSINESS plan');
  }
}
