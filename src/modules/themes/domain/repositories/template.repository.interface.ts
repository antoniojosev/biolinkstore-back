import { Plan, TemplateNiche } from '@prisma/client';
import { Template } from '../entities/template.entity';

export interface ListTemplatesFilter {
  niche?: TemplateNiche;
  plan?: Plan;
}

export interface ITemplateRepository {
  findActive(filter: ListTemplatesFilter): Promise<Template[]>;
  findActiveByKey(key: string): Promise<Template | null>;
}
