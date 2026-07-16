import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { ITemplateRepository } from '../../domain/repositories/template.repository.interface';
import { TemplateDetailDto } from '../dto/template-response.dto';

@Injectable()
export class GetTemplateUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.TEMPLATE_REPOSITORY)
    private readonly templateRepository: ITemplateRepository,
  ) {}

  async execute(key: string): Promise<TemplateDetailDto> {
    const template = await this.templateRepository.findActiveByKey(key);

    if (!template) {
      throw new NotFoundException(`Template not found: ${key}`);
    }

    return {
      key: template.key,
      name: template.name,
      niche: template.niche,
      planRequired: template.planRequired,
      previewImage: template.previewImage,
      sectionSchema: template.sectionSchema,
      defaultTokens: template.defaultTokens,
      stylePresets: template.stylePresets ?? null,
      version: template.version,
    };
  }
}
