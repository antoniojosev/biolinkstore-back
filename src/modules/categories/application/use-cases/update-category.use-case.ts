import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CategoryMapper } from '../mappers/category.mapper';
import { generateSlug } from '@/common/utils/slug.util';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(categoryId: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const existingCategory = await this.categoryRepository.findById(categoryId);
    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    // If name changed, generate new slug
    let slug = dto.name ? generateSlug(dto.name) : undefined;
    if (slug && slug !== existingCategory.slug) {
      let counter = 1;
      let tempSlug = slug;
      while (await this.categoryRepository.checkSlugExists(existingCategory.storeId, tempSlug)) {
        tempSlug = `${slug}-${counter}`;
        counter++;
      }
      slug = tempSlug;
    } else {
      slug = undefined;
    }

    const category = await this.categoryRepository.update(categoryId, {
      ...dto,
      slug,
    });

    return CategoryMapper.toResponse(category);
  }
}
