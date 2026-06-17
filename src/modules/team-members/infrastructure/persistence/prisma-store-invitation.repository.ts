import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import {
  CreateStoreInvitationData,
  IStoreInvitationRepository,
} from '../../domain/repositories/store-invitation.repository.interface';
import { StoreInvitation } from '../../domain/entities/store-invitation.entity';

@Injectable()
export class PrismaStoreInvitationRepository implements IStoreInvitationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByToken(token: string): Promise<StoreInvitation | null> {
    const row = await this.prisma.storeInvitation.findUnique({
      where: { token },
      include: {
        store: { select: { id: true, name: true, slug: true, logo: true } },
        inviter: { select: { id: true, name: true, email: true } },
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async findById(id: string): Promise<StoreInvitation | null> {
    const row = await this.prisma.storeInvitation.findUnique({
      where: { id },
      include: {
        store: { select: { id: true, name: true, slug: true, logo: true } },
        inviter: { select: { id: true, name: true, email: true } },
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async findPendingByEmail(email: string): Promise<StoreInvitation[]> {
    const rows = await this.prisma.storeInvitation.findMany({
      where: {
        email,
        acceptedAt: null,
        declinedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        store: { select: { id: true, name: true, slug: true, logo: true } },
        inviter: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findPendingByStoreAndEmail(
    storeId: string,
    email: string,
  ): Promise<StoreInvitation | null> {
    const row = await this.prisma.storeInvitation.findFirst({
      where: {
        storeId,
        email,
        acceptedAt: null,
        declinedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        store: { select: { id: true, name: true, slug: true, logo: true } },
        inviter: { select: { id: true, name: true, email: true } },
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async create(data: CreateStoreInvitationData): Promise<StoreInvitation> {
    const row = await this.prisma.storeInvitation.create({
      data,
      include: {
        store: { select: { id: true, name: true, slug: true, logo: true } },
        inviter: { select: { id: true, name: true, email: true } },
      },
    });
    return this.toDomain(row);
  }

  async markAccepted(id: string): Promise<StoreInvitation> {
    const row = await this.prisma.storeInvitation.update({
      where: { id },
      data: { acceptedAt: new Date() },
      include: {
        store: { select: { id: true, name: true, slug: true, logo: true } },
        inviter: { select: { id: true, name: true, email: true } },
      },
    });
    return this.toDomain(row);
  }

  async markDeclined(id: string): Promise<StoreInvitation> {
    const row = await this.prisma.storeInvitation.update({
      where: { id },
      data: { declinedAt: new Date() },
      include: {
        store: { select: { id: true, name: true, slug: true, logo: true } },
        inviter: { select: { id: true, name: true, email: true } },
      },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.storeInvitation.delete({ where: { id } });
  }

  private toDomain(row: any): StoreInvitation {
    return new StoreInvitation({
      id: row.id,
      storeId: row.storeId,
      email: row.email,
      role: row.role,
      token: row.token,
      invitedBy: row.invitedBy,
      expiresAt: row.expiresAt,
      acceptedAt: row.acceptedAt,
      declinedAt: row.declinedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      store: row.store
        ? {
            id: row.store.id,
            name: row.store.name,
            slug: row.store.slug,
            logo: row.store.logo,
          }
        : undefined,
      inviter: row.inviter
        ? {
            id: row.inviter.id,
            name: row.inviter.name,
            email: row.inviter.email,
          }
        : undefined,
    });
  }
}
