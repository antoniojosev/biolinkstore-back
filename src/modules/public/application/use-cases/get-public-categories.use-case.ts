import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IStoreRepository } from '@/modules/stores/domain/repositories/store.repository.interface';
import { ICategoryRepository } from '@/modules/categories/domain/repositories/category.repository.interface';
import { PublicCategoryResponseDto } from '../dto/public-category-response.dto';

@Injectable()
export class GetPublicCategoriesUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.STORE_REPOSITORY)
    private readonly storeRepository: IStoreRepository,
    @Inject(INJECTION_TOKENS.CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(slug: string): Promise<PublicCategoryResponseDto[]> {
    // Verify store exists
    const store = await this.storeRepository.findBySlug(slug);
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Get all visible categories
    const result = await this.categoryRepository.findByStoreId(store.id, {
      page: 1,
      limit: 100, // Get all categories
      sortBy: 'sortOrder',
      sortOrder: 'asc',
    });

    // Filter only visible and map to public response
    return result.data
      .filter((category) => category.isVisible)
      .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        productCount: category.productCount || 0,
      }));
  }
}
