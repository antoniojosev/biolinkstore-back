import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStorageService } from '@/infrastructure/storage/storage.interface';
import { IProductRepository } from '@/modules/products/domain/repositories/product.repository.interface';
import { CreateProductUseCase } from '@/modules/products/application/use-cases/create-product.use-case';
import { CreateProductDto } from '@/modules/products/application/dto/create-product.dto';
import { ApifyPost } from '../../infrastructure/apify/apify-instagram.client';
import { InstagramPostClassifierService } from '../../infrastructure/ai/instagram-post-classifier.service';
import { downloadImage } from '../../infrastructure/http/download-image.util';

export type ProcessPostOutcome = 'created' | 'skipped' | 'limit';

const MAX_IMAGES_PER_PRODUCT = 5;
const MIN_CONFIDENCE = 0.5;

@Injectable()
export class ProcessInstagramPostUseCase {
  private readonly logger = new Logger(ProcessInstagramPostUseCase.name);

  constructor(
    @Inject(INJECTION_TOKENS.STORAGE_SERVICE)
    private readonly storageService: IStorageService,
    @Inject(INJECTION_TOKENS.PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly classifier: InstagramPostClassifierService,
  ) {}

  async execute(storeId: string, importId: string, post: ApifyPost): Promise<ProcessPostOutcome> {
    const imageUrls = this.collectImageUrls(post);
    if (imageUrls.length === 0) return 'skipped';

    const primary = await downloadImage(imageUrls[0]);
    if (!primary) return 'skipped';

    const classification = await this.classifier.classify(
      primary.buffer,
      primary.mimeType,
      post.caption ?? '',
    );
    if (!classification || !classification.isProduct || classification.confidence < MIN_CONFIDENCE) {
      return 'skipped';
    }

    const uploadedUrls: string[] = [];
    for (const [i, url] of imageUrls.slice(0, MAX_IMAGES_PER_PRODUCT).entries()) {
      const downloaded = i === 0 ? primary : await downloadImage(url);
      if (!downloaded) continue;
      const ext = downloaded.mimeType === 'image/png' ? 'png' : 'jpg';
      const key = `stores/${storeId}/instagram-import/${importId}/${randomUUID()}.${ext}`;
      const uploadedUrl = await this.storageService.upload(
        downloaded.buffer,
        key,
        downloaded.mimeType,
      );
      uploadedUrls.push(uploadedUrl);
    }
    if (uploadedUrls.length === 0) return 'skipped';

    const dto: CreateProductDto = {
      name: classification.name?.slice(0, 120) || 'Producto importado de Instagram',
      description: classification.description || undefined,
      basePrice: classification.price ?? 0,
      priceCurrency: classification.currency ?? 'USD',
      images: uploadedUrls,
      isVisible: false,
    } as CreateProductDto;

    try {
      const created = await this.createProductUseCase.execute(storeId, dto);
      await this.productRepository.update(created.id, { instagramImportId: importId });
      return 'created';
    } catch (err) {
      if (err instanceof ForbiddenException) return 'limit';
      this.logger.warn(`No se pudo crear producto desde post importado: ${(err as Error).message}`);
      return 'skipped';
    }
  }

  private collectImageUrls(post: ApifyPost): string[] {
    if (post.images && post.images.length > 0) return post.images;
    if (post.displayUrl) return [post.displayUrl];
    return [];
  }
}
