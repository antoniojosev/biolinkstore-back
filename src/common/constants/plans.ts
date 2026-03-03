import { Plan } from '@prisma/client';

export interface PlanFeatures {
  maxProducts: number;
  maxImages: number;
  maxCategories: number;
  customDomain: boolean;
  analytics: 'none' | 'basic' | 'advanced';
  removeBranding: boolean;
  proTemplates: boolean;
  exportQuotes: boolean;
  multiStore: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  [Plan.FREE]: {
    maxProducts: 20,
    maxImages: 5,
    maxCategories: 5,
    customDomain: true,
    analytics: 'basic',
    removeBranding: false,
    proTemplates: false,
    exportQuotes: false,
    multiStore: false,
    apiAccess: false,
    prioritySupport: false,
  },
  [Plan.PRO]: {
    maxProducts: 100,
    maxImages: 10,
    maxCategories: -1, // unlimited
    customDomain: true,
    analytics: 'advanced',
    removeBranding: true,
    proTemplates: true,
    exportQuotes: true,
    multiStore: false,
    apiAccess: false,
    prioritySupport: true,
  },
  [Plan.BUSINESS]: {
    maxProducts: -1, // unlimited
    maxImages: -1, // unlimited
    maxCategories: -1, // unlimited
    customDomain: true,
    analytics: 'advanced',
    removeBranding: true,
    proTemplates: true,
    exportQuotes: true,
    multiStore: true,
    apiAccess: true,
    prioritySupport: true,
  },
};
