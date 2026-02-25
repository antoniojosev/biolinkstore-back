import { Injectable, Inject } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { generateSlug } from '@/common/utils/slug.util';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CategoryMapper } from '../mappers/category.mapper';

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(storeId: string, dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    // Generate unique slug
    const baseSlug = generateSlug(dto.name);
    let slug = baseSlug;
    let counter = 1;

    while (await this.categoryRepository.checkSlugExists(storeId, slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const category = await this.categoryRepository.create({
      storeId,
      name: dto.name,
      slug,
      description: dto.description,
      image: dto.image,
      isVisible: dto.isVisible ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });

    return CategoryMapper.toResponse(category);
  }
}
