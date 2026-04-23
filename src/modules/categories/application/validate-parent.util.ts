import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ICategoryRepository } from '../domain/repositories/category.repository.interface';

const MAX_DEPTH = 4;

export async function validateParent(
  repo: ICategoryRepository,
  storeId: string,
  parentId: string | null | undefined,
  selfId?: string,
): Promise<void> {
  if (parentId == null) return;
  if (selfId && parentId === selfId) {
    throw new BadRequestException('Una categoria no puede ser padre de si misma');
  }

  const parent = await repo.findById(parentId);
  if (!parent || parent.storeId !== storeId) {
    throw new NotFoundException('Parent category not found in this store');
  }

  let cursor = parent;
  let depth = 1;
  while (cursor.parentId) {
    if (selfId && cursor.parentId === selfId) {
      throw new BadRequestException('Ciclo detectado en la jerarquia de categorias');
    }
    depth++;
    if (depth > MAX_DEPTH) {
      throw new BadRequestException(
        `Profundidad maxima de categorias es ${MAX_DEPTH}`,
      );
    }
    const next = await repo.findById(cursor.parentId);
    if (!next) break;
    cursor = next;
  }
}
