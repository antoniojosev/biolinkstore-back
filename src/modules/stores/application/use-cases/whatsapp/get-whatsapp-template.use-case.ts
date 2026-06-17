import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '../../../domain/repositories/store.repository.interface';
import {
  DEFAULT_WHATSAPP_TEMPLATE,
  WhatsappTemplateEngine,
} from '../../../domain/services/whatsapp-template.engine';
import { WhatsappTemplateResponseDto } from '../../dto/whatsapp-template.dto';

@Injectable()
export class GetWhatsappTemplateUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    private readonly engine: WhatsappTemplateEngine,
  ) {}

  async execute(storeId: string): Promise<WhatsappTemplateResponseDto> {
    const store = await this.storeRepository.findByIdWithSubscription(storeId);
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    const template = store.whatsappTemplate ?? DEFAULT_WHATSAPP_TEMPLATE;
    const plan = store.subscription?.plan ?? 'FREE';
    return {
      template,
      isDefault: store.whatsappTemplate === null,
      canEdit: plan !== 'FREE',
      supportedVariables: this.engine.listSupportedVariables(),
    };
  }
}
