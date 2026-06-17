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

  async execute(slug: string, tree = false): Promise<PublicCategoryResponseDto[]> {
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
    const flat: PublicCategoryResponseDto[] = result.data
      .filter((category) => category.isVisible)
      .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        parentId: category.parentId,
        productCount: category.productCount || 0,
      }));

    if (!tree) {
      return flat;
    }

    return this.buildTree(flat);
  }

  /**
   * Builds a nested tree from a flat list in O(n).
   * Orphaned children (parentId pointing to a hidden/missing parent)
   * are surfaced as roots to avoid data loss.
   */
  private buildTree(flat: PublicCategoryResponseDto[]): PublicCategoryResponseDto[] {
    const map = new Map<string, PublicCategoryResponseDto>(
      flat.map((c) => [c.id, { ...c, children: [] }]),
    );
    const roots: PublicCategoryResponseDto[] = [];

    for (const node of map.values()) {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
