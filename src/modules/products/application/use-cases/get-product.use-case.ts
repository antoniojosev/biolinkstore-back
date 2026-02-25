import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IProductRepository } from '../../domain/repositories/product.repository.interface';
import { ProductResponseDto } from '../dto/product-response.dto';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class GetProductUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(productId: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return ProductMapper.toResponse(product);
  }
}
