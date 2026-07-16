import { Plan, TemplateNiche } from '@prisma/client';

export class Template {
  id: string;
  key: string;
  name: string;
  niche: TemplateNiche;
  planRequired: Plan;
  previewImage: string | null;
  demoDataJson: unknown;
  sectionSchema: unknown;
  defaultTokens: unknown;
  stylePresets: unknown | null;
  version: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Template>) {
    Object.assign(this, partial);
  }
}
