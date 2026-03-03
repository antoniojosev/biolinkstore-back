import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { PLAN_FEATURES } from '@/common/constants/plans';
import { IStorageService } from '@/infrastructure/storage/storage.interface';
import { WatermarkService } from '@/infrastructure/image/watermark.service';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { UploadResponseDto } from '../dto/upload-response.dto';

@Injectable()
export class UploadFilesUseCase {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  private readonly ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'application/pdf',
  ]);

  constructor(
    @Inject(INJECTION_TOKENS.STORAGE_SERVICE)
    private readonly storageService: IStorageService,
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    private readonly watermarkService: WatermarkService,
  ) {}

  async execute(storeId: string, files: Express.Multer.File[]): Promise<UploadResponseDto[]> {
    for (const file of files) {
      if (!this.ALLOWED_MIME_TYPES.has(file.mimetype)) {
        throw new BadRequestException(`Tipo de archivo no permitido: ${file.mimetype}`);
      }
      if (file.size > this.MAX_FILE_SIZE) {
        throw new BadRequestException(
          `Archivo demasiado grande (max 5 MB): ${file.originalname}`,
        );
      }
    }

    const store = await this.storeRepository.findByIdWithSubscription(storeId);
    const plan = store?.subscription?.plan ?? 'FREE';
    const canRemoveBranding = PLAN_FEATURES[plan].removeBranding;
    const shouldWatermark = canRemoveBranding ? store?.showBranding !== false : true;

    return Promise.all(
      files.map(async (file) => {
        const ext = file.originalname.split('.').pop() ?? 'jpg';
        const isPdf = file.mimetype === 'application/pdf';
        const subfolder = isPdf ? 'documents' : 'products';
        const key = `stores/${storeId}/${subfolder}/${crypto.randomUUID()}.${ext}`;

        let buffer = file.buffer;
        if (!isPdf && shouldWatermark && file.mimetype !== 'image/gif') {
          buffer = await this.watermarkService.apply(buffer);
        }

        const url = await this.storageService.upload(buffer, key, file.mimetype);
        return { url, key, mimeType: file.mimetype, size: file.size };
      }),
    );
  }
}
