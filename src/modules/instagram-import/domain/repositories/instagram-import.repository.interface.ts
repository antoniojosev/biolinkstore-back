import { InstagramImport, InstagramImportStatus } from '../entities/instagram-import.entity';

export interface CreateInstagramImportData {
  storeId: string;
  handle: string;
}

export interface UpdateInstagramImportData {
  status?: InstagramImportStatus;
  apifyRunId?: string;
  apifyDatasetId?: string;
  postsFound?: number;
  postsProcessed?: number;
  postsSkipped?: number;
  productsCreated?: number;
  profileName?: string;
  profileFollowers?: number;
  error?: string | null;
  finishedAt?: Date;
}

export interface IInstagramImportRepository {
  create(data: CreateInstagramImportData): Promise<InstagramImport>;
  findById(id: string): Promise<InstagramImport | null>;
  /** Ultimo import (por requestedAt) de la tienda, si existe. */
  findLatestByStoreId(storeId: string): Promise<InstagramImport | null>;
  /** Import con status RUNNING o PROCESSING para esta tienda, si hay uno (regla: 1 activo a la vez). */
  findActiveByStoreId(storeId: string): Promise<InstagramImport | null>;
  update(id: string, data: UpdateInstagramImportData): Promise<InstagramImport>;
  /** Productos creados por este import, mas recientes primero (para la animacion). */
  findCreatedProducts(
    importId: string,
  ): Promise<Array<{ id: string; name: string; images: string[]; basePrice: number }>>;
}
