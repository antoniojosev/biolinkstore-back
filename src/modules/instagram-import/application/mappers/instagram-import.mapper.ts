import { InstagramImport } from '../../domain/entities/instagram-import.entity';
import { InstagramImportStatusDto } from '../dto/instagram-import-status.dto';

export class InstagramImportMapper {
  static toStatusDto(
    entity: InstagramImport,
    products: Array<{ id: string; name: string; images: string[]; basePrice: number }>,
  ): InstagramImportStatusDto {
    return {
      id: entity.id,
      status: entity.status,
      handle: entity.handle,
      profileName: entity.profileName,
      profileFollowers: entity.profileFollowers,
      postsFound: entity.postsFound,
      postsProcessed: entity.postsProcessed,
      postsSkipped: entity.postsSkipped,
      productsCreated: entity.productsCreated,
      products,
      error: entity.error,
      requestedAt: entity.requestedAt,
      finishedAt: entity.finishedAt,
    };
  }
}
