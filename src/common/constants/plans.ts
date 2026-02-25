import { Plan } from '@prisma/client';

export interface PlanFeatures {
  maxProducts: number;
  maxImages: number;
  customDomain: boolean;
  analytics: boolean;
  removeBranding: boolean;
  prioritySupport: boolean;
}

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  [Plan.FREE]: {
    maxProducts: 10,
    maxImages: 3,
    customDomain: false,
    analytics: false,
    removeBranding: false,
    prioritySupport: false,
  },
  [Plan.PRO]: {
    maxProducts: 100,
    maxImages: 10,
    customDomain: false,
    analytics: true,
    removeBranding: true,
    prioritySupport: false,
  },
  [Plan.BUSINESS]: {
    maxProducts: -1, // unlimited
    maxImages: -1, // unlimited
    customDomain: true,
    analytics: true,
    removeBranding: true,
    prioritySupport: true,
  },
};
