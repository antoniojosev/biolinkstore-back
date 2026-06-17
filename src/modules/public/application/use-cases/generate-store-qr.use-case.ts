import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { resolvePublicStore } from '../services/resolve-public-store.helper';

export interface StoreQrResult {
  buffer: Buffer;
  targetUrl: string;
}

@Injectable()
export class GenerateStoreQrUseCase {
  private static readonly QR_SIZE = 512;

  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(slug: string): Promise<StoreQrResult> {
    // BE-122: resolve via slug or verified custom domain
    const store = await resolvePublicStore(this.storeRepository, slug);

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    if (!frontendUrl) {
      throw new Error('FRONTEND_URL not configured');
    }

    const targetUrl = `${frontendUrl.replace(/\/$/, '')}/${store.slug}`;

    const buffer = await QRCode.toBuffer(targetUrl, {
      type: 'png',
      width: GenerateStoreQrUseCase.QR_SIZE,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return { buffer, targetUrl };
  }
}
