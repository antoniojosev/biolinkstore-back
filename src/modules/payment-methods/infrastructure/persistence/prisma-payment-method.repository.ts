import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { StorePaymentMethod, PaymentMethodType } from '../../domain/entities/payment-method.entity';
import {
  IPaymentMethodRepository,
  CreatePaymentMethodData,
  UpdatePaymentMethodData,
} from '../../domain/repositories/payment-method.repository.interface';

type PrismaRow = {
  id: string;
  storeId: string;
  type: string;
  label: string;
  details: unknown;
  instructions: string | null;
  enabled: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

function toDomain(row: PrismaRow): StorePaymentMethod {
  return new StorePaymentMethod({
    id: row.id,
    storeId: row.storeId,
    type: row.type as PaymentMethodType,
    label: row.label,
    details: (row.details ?? {}) as Record<string, unknown>,
    instructions: row.instructions,
    enabled: row.enabled,
    displayOrder: row.displayOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaPaymentMethodRepository implements IPaymentMethodRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<StorePaymentMethod | null> {
    const row = await this.prisma.storePaymentMethod.findUnique({ where: { id } });
    return row ? toDomain(row as PrismaRow) : null;
  }

  async findByStoreId(storeId: string): Promise<StorePaymentMethod[]> {
    const rows = await this.prisma.storePaymentMethod.findMany({
      where: { storeId },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((r) => toDomain(r as PrismaRow));
  }

  async countByStoreId(storeId: string): Promise<number> {
    return this.prisma.storePaymentMethod.count({ where: { storeId } });
  }

  async create(data: CreatePaymentMethodData): Promise<StorePaymentMethod> {
    const row = await this.prisma.storePaymentMethod.create({
      data: {
        storeId: data.storeId,
        type: data.type,
        label: data.label,
        details: data.details as object,
        instructions: data.instructions ?? null,
        enabled: data.enabled ?? true,
        displayOrder: data.displayOrder ?? 0,
      },
    });
    return toDomain(row as PrismaRow);
  }

  async update(id: string, data: UpdatePaymentMethodData): Promise<StorePaymentMethod> {
    const row = await this.prisma.storePaymentMethod.update({
      where: { id },
      data: {
        ...(data.type !== undefined && { type: data.type }),
        ...(data.label !== undefined && { label: data.label }),
        ...(data.details !== undefined && { details: data.details as object }),
        ...(data.instructions !== undefined && { instructions: data.instructions }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
      },
    });
    return toDomain(row as PrismaRow);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.storePaymentMethod.delete({ where: { id } });
  }
}
