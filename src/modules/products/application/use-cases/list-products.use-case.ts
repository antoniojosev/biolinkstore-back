import { Injectable, Inject } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IProductRepository, ProductFilterParams } from '../../domain/repositories/product.repository.interface';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { ProductResponseDto } from '../dto/product-response.dto';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(
    storeId: string,
    params: ProductFilterParams,
  ): Promise<PaginatedResult<ProductResponseDto>> {
    const result = await this.productRepository.findByStoreId(storeId, params);

    return {
      data: result.data.map((product) => ProductMapper.toResponse(product)),
      meta: result.meta,
    };
  }
}
