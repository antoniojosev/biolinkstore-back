import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStorageService } from '@/infrastructure/storage/storage.interface';
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
  ]);

  constructor(
    @Inject(INJECTION_TOKENS.STORAGE_SERVICE)
    private readonly storageService: IStorageService,
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

    return Promise.all(
      files.map(async (file) => {
        const ext = file.originalname.split('.').pop() ?? 'jpg';
        const key = `stores/${storeId}/products/${crypto.randomUUID()}.${ext}`;
        const url = await this.storageService.upload(file.buffer, key, file.mimetype);
        return { url, key, mimeType: file.mimetype, size: file.size };
      }),
    );
  }
}
