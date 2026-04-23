import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '../../../domain/repositories/store.repository.interface';
import {
  DEFAULT_WHATSAPP_TEMPLATE,
  WhatsappTemplateEngine,
} from '../../../domain/services/whatsapp-template.engine';
import {
  UpdateWhatsappTemplateDto,
  WhatsappTemplateResponseDto,
} from '../../dto/whatsapp-template.dto';

@Injectable()
export class UpdateWhatsappTemplateUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    private readonly engine: WhatsappTemplateEngine,
  ) {}

  async execute(storeId: string, dto: UpdateWhatsappTemplateDto): Promise<WhatsappTemplateResponseDto> {
    const store = await this.storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (dto.template !== null) {
      const { valid, errors } = this.engine.validateTemplate(dto.template);
      if (!valid) {
        throw new BadRequestException({ message: 'Invalid WhatsApp template', errors });
      }
    }

    await this.storeRepository.update(storeId, { whatsappTemplate: dto.template });

    return {
      template: dto.template ?? DEFAULT_WHATSAPP_TEMPLATE,
      isDefault: dto.template === null,
      supportedVariables: this.engine.listSupportedVariables(),
    };
  }
}
