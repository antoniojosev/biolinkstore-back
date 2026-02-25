import { Injectable, Inject } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { ICategoryRepository } from '../../domain/repositories/category.repository.interface';
import { PaginatedResult, PaginationParams } from '@/common/interfaces/pagination.interface';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CategoryMapper } from '../mappers/category.mapper';

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(
    storeId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<CategoryResponseDto>> {
    const result = await this.categoryRepository.findByStoreId(storeId, params);

    return {
      data: result.data.map((category) => CategoryMapper.toResponse(category)),
      meta: result.meta,
    };
  }
}
