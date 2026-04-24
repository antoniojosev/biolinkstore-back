import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

interface SlugMissRanking {
  slug: string;
  hits: number;
  lastSeen: Date;
}

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/slug-misses')
export class AdminSlugMissesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Ranking of slug misses (requested but non-existent stores)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({ status: 200, description: 'Ranked slug misses' })
  async list(@Query('limit') limitRaw?: string): Promise<SlugMissRanking[]> {
    const limit = Math.min(Math.max(parseInt(limitRaw ?? '50', 10) || 50, 1), 200);

    const grouped = await this.prisma.slugMiss.groupBy({
      by: ['slug'],
      _count: { slug: true },
      _max: { createdAt: true },
      orderBy: { _count: { slug: 'desc' } },
      take: limit,
    });

    return grouped.map((g) => ({
      slug: g.slug,
      hits: g._count.slug,
      lastSeen: g._max.createdAt!,
    }));
  }
}
