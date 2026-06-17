import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { ITemplateRepository } from '../../domain/repositories/template.repository.interface';
import { TemplatePreviewResponseDto } from '../dto/template-preview-response.dto';
import {
  defaultTokensFor,
  defaultTreeFor,
} from '../services/template-defaults.helper';

/**
 * GET /public/templates/:key/preview — preview público con DEMO data.
 *
 * Lógica:
 *   1. Cargar Template por key. 404 si no existe O no está activo.
 *      `findActiveByKey` ya filtra por `isActive=true`, por lo que un template
 *      desactivado se trata exactamente igual que uno inexistente — semántica
 *      correcta para un endpoint público de catálogo.
 *   2. Devolver metadata + demoData seedeada + tree default + tokens default.
 *
 * NO requiere auth (es catálogo público — mismo nivel que GET /templates/:key).
 * NO escribe en DB.
 */
@Injectable()
export class GetTemplatePreviewUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.TEMPLATE_REPOSITORY)
    private readonly templateRepo: ITemplateRepository,
  ) {}

  async execute(key: string): Promise<TemplatePreviewResponseDto> {
    const template = await this.templateRepo.findActiveByKey(key);

    if (!template) {
      throw new NotFoundException(`Template not found: ${key}`);
    }

    return {
      template: template.key,
      templateVersion: template.version,
      name: template.name,
      niche: template.niche,
      demoData: template.demoDataJson ?? {},
      tree: defaultTreeFor(template),
      tokens: defaultTokensFor(template),
    };
  }
}
