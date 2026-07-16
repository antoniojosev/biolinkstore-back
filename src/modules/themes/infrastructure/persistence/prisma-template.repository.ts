import { Injectable } from '@nestjs/common';
import { Plan, Template as PrismaTemplate } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { Template } from '../../domain/entities/template.entity';
import {
  ITemplateRepository,
  ListTemplatesFilter,
} from '../../domain/repositories/template.repository.interface';

/**
 * Orden de planes para gating de templates.
 * Templates marcados con planRequired=PRO son visibles para PRO y BUSINESS.
 */
const PLAN_LEVEL: Record<Plan, number> = {
  FREE: 0,
  PRO: 1,
  BUSINESS: 2,
};

function plansAtOrBelow(plan: Plan): Plan[] {
  const ceiling = PLAN_LEVEL[plan];
  return (Object.keys(PLAN_LEVEL) as Plan[]).filter((p) => PLAN_LEVEL[p] <= ceiling);
}

function toDomain(row: PrismaTemplate): Template {
  return new Template({
    id: row.id,
    key: row.key,
    name: row.name,
    niche: row.niche,
    planRequired: row.planRequired,
    previewImage: row.previewImage,
    demoDataJson: row.demoDataJson,
    sectionSchema: row.sectionSchema,
    defaultTokens: row.defaultTokens,
    stylePresets: row.stylePresets,
    version: row.version,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaTemplateRepository implements ITemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActive(filter: ListTemplatesFilter): Promise<Template[]> {
    const where: {
      isActive: boolean;
      niche?: PrismaTemplate['niche'];
      planRequired?: { in: Plan[] };
    } = { isActive: true };

    if (filter.niche) {
      where.niche = filter.niche;
    }
    if (filter.plan) {
      where.planRequired = { in: plansAtOrBelow(filter.plan) };
    }

    const rows = await this.prisma.template.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return rows.map(toDomain);
  }

  async findActiveByKey(key: string): Promise<Template | null> {
    const row = await this.prisma.template.findUnique({ where: { key } });
    if (!row || !row.isActive) {
      return null;
    }
    return toDomain(row);
  }
}
