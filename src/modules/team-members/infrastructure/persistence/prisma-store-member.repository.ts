import { Injectable } from '@nestjs/common';
import { StoreMemberRole } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import {
  CreateStoreMemberData,
  IStoreMemberRepository,
} from '../../domain/repositories/store-member.repository.interface';
import { StoreMember } from '../../domain/entities/store-member.entity';

@Injectable()
export class PrismaStoreMemberRepository implements IStoreMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByStoreId(storeId: string): Promise<StoreMember[]> {
    const rows = await this.prisma.storeMember.findMany({
      where: { storeId },
      include: {
        user: { select: { id: true, email: true, name: true, avatar: true } },
      },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByStoreAndUser(storeId: string, userId: string): Promise<StoreMember | null> {
    const row = await this.prisma.storeMember.findUnique({
      where: { storeId_userId: { storeId, userId } },
      include: {
        user: { select: { id: true, email: true, name: true, avatar: true } },
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async findById(id: string): Promise<StoreMember | null> {
    const row = await this.prisma.storeMember.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, avatar: true } },
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async countByStoreId(storeId: string): Promise<number> {
    return this.prisma.storeMember.count({ where: { storeId } });
  }

  async countOwnersByStoreId(storeId: string): Promise<number> {
    return this.prisma.storeMember.count({ where: { storeId, role: 'OWNER' } });
  }

  async create(data: CreateStoreMemberData): Promise<StoreMember> {
    const row = await this.prisma.storeMember.create({
      data: {
        storeId: data.storeId,
        userId: data.userId,
        role: data.role,
        invitedBy: data.invitedBy ?? null,
      },
      include: {
        user: { select: { id: true, email: true, name: true, avatar: true } },
      },
    });
    return this.toDomain(row);
  }

  async updateRole(id: string, role: StoreMemberRole): Promise<StoreMember> {
    const row = await this.prisma.storeMember.update({
      where: { id },
      data: { role },
      include: {
        user: { select: { id: true, email: true, name: true, avatar: true } },
      },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.storeMember.delete({ where: { id } });
  }

  private toDomain(row: any): StoreMember {
    return new StoreMember({
      id: row.id,
      storeId: row.storeId,
      userId: row.userId,
      role: row.role,
      invitedBy: row.invitedBy ?? null,
      joinedAt: row.joinedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: row.user
        ? {
            id: row.user.id,
            email: row.user.email,
            name: row.user.name,
            avatar: row.user.avatar,
          }
        : undefined,
    });
  }
}
