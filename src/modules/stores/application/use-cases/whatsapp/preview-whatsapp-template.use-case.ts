import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '../../../domain/repositories/store.repository.interface';
import { WhatsappTemplateEngine } from '../../../domain/services/whatsapp-template.engine';
import {
  PreviewWhatsappTemplateDto,
  PreviewWhatsappTemplateResponseDto,
} from '../../dto/whatsapp-template.dto';

@Injectable()
export class PreviewWhatsappTemplateUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    private readonly engine: WhatsappTemplateEngine,
  ) {}

  async execute(
    storeId: string,
    dto: PreviewWhatsappTemplateDto,
  ): Promise<PreviewWhatsappTemplateResponseDto> {
    const store = await this.storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const validation = this.engine.validateTemplate(dto.template);
    const ctx = this.engine.buildSampleContext(store.name, store.slug);
    const rendered = validation.valid ? this.engine.render(dto.template, ctx) : '';

    return {
      rendered,
      errors: validation.errors,
    };
  }
}
