import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { IOrderRepository, CreateOrderData, OrderFilterParams } from '../../domain/repositories/order.repository.interface';
import { OrderIntent } from '../../domain/entities/order-intent.entity';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';
import { createPaginatedResult, calculateSkip } from '@/common/utils/pagination.util';

@Injectable()
export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(order: any): OrderIntent {
    return new OrderIntent({
      id: order.id,
      storeId: order.storeId,
      visitorId: order.visitorId,
      items: order.items?.map((item: any) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
      })) ?? [],
      subtotal: Number(order.subtotal),
      total: Number(order.total),
      currency: order.currency,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail,
      customerAddress: order.customerAddress,
      customerNotes: order.customerNotes,
      status: order.status,
      channel: order.channel,
      whatsappNumber: order.whatsappNumber,
      messageGenerated: order.messageGenerated,
      createdAt: order.createdAt,
    });
  }

  async findById(id: string): Promise<OrderIntent | null> {
    const order = await this.prisma.orderIntent.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) return null;
    return this.mapToEntity(order);
  }

  async findByStoreId(
    storeId: string,
    params: OrderFilterParams = {},
  ): Promise<PaginatedResult<OrderIntent>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', status } = params;

    const where: any = { storeId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      this.prisma.orderIntent.findMany({
        where,
        include: { items: true },
        skip: calculateSkip(page, limit),
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.orderIntent.count({ where }),
    ]);

    return createPaginatedResult(orders.map((o) => this.mapToEntity(o)), total, { page, limit });
  }

  async create(data: CreateOrderData): Promise<OrderIntent> {
    const order = await this.prisma.orderIntent.create({
      data: {
        storeId: data.storeId,
        visitorId: data.visitorId,
        subtotal: data.subtotal,
        total: data.total,
        currency: data.currency,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        customerAddress: data.customerAddress,
        customerNotes: data.customerNotes,
        channel: data.channel,
        whatsappNumber: data.whatsappNumber,
        messageGenerated: data.messageGenerated,
        items: {
          create: data.items,
        },
      },
      include: { items: true },
    });

    return this.mapToEntity(order);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<OrderIntent> {
    const order = await this.prisma.orderIntent.update({
      where: { id },
      data: { status },
      include: { items: true },
    });

    return this.mapToEntity(order);
  }

  async countByStoreId(storeId: string, since?: Date): Promise<number> {
    return this.prisma.orderIntent.count({
      where: {
        storeId,
        ...(since ? { createdAt: { gte: since } } : {}),
      },
    });
  }
}
