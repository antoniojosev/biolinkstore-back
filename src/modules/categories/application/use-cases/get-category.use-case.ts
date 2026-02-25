import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CategoryMapper } from '../mappers/category.mapper';

@Injectable()
export class GetCategoryUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(categoryId: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findById(categoryId);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return CategoryMapper.toResponse(category);
  }
}
