import { Injectable } from '@nestjs/common';
import { PalettePreset as PrismaPalettePreset } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { PalettePreset } from '../../domain/entities/palette-preset.entity';
import { IPalettePresetRepository } from '../../domain/repositories/palette-preset.repository.interface';

function toDomain(row: PrismaPalettePreset): PalettePreset {
  return new PalettePreset({
    id: row.id,
    key: row.key,
    name: row.name,
    colorsJson: row.colorsJson,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaPalettePresetRepository implements IPalettePresetRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActive(): Promise<PalettePreset[]> {
    const rows = await this.prisma.palettePreset.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(toDomain);
  }
}
