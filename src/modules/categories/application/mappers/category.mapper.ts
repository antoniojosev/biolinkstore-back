import { Category as PrismaCategory } from '@prisma/client';
import { Category } from '../../domain/entities/category.entity';
import { CategoryResponseDto } from '../dto/category-response.dto';

type CategoryWithCount = PrismaCategory & {
  _count?: {
    products: number;
  };
};

export class CategoryMapper {
  static toDomain(prismaCategory: CategoryWithCount): Category {
    return new Category({
      id: prismaCategory.id,
      storeId: prismaCategory.storeId,
      name: prismaCategory.name,
      slug: prismaCategory.slug,
      description: prismaCategory.description,
      image: prismaCategory.image,
      isVisible: prismaCategory.isVisible,
      sortOrder: prismaCategory.sortOrder,
      productCount: prismaCategory._count?.products,
      createdAt: prismaCategory.createdAt,
      updatedAt: prismaCategory.updatedAt,
    });
  }

  static toResponse(category: Category): CategoryResponseDto {
    return {
      id: category.id,
      storeId: category.storeId,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      isVisible: category.isVisible,
      sortOrder: category.sortOrder,
      productCount: category.productCount,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
