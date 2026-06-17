import { Inject, Injectable } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import {
  ITemplateRepository,
  ListTemplatesFilter,
} from '../../domain/repositories/template.repository.interface';
import { Template } from '../../domain/entities/template.entity';
import { TemplateListItemDto } from '../dto/template-response.dto';

function toListItem(template: Template): TemplateListItemDto {
  return {
    key: template.key,
    name: template.name,
    niche: template.niche,
    planRequired: template.planRequired,
    previewImage: template.previewImage,
    version: template.version,
    sortOrder: template.sortOrder,
  };
}

@Injectable()
export class ListTemplatesUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.TEMPLATE_REPOSITORY)
    private readonly templateRepository: ITemplateRepository,
  ) {}

  async execute(filter: ListTemplatesFilter): Promise<TemplateListItemDto[]> {
    const templates = await this.templateRepository.findActive(filter);
    return templates.map(toListItem);
  }
}
