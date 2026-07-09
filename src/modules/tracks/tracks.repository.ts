import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface TrackFilter {
  q?: string;
  genre?: string;
  mood?: string;
  commercialOnly: boolean;
  page: number;
  limit: number;
}

function buildWhere(filter: Pick<TrackFilter, 'q' | 'genre' | 'mood' | 'commercialOnly'>): Prisma.TrackWhereInput {
  const where: Prisma.TrackWhereInput = {};

  if (filter.commercialOnly) {
    where.commercialSafe = true;
  }
  if (filter.genre) {
    where.genre = { equals: filter.genre, mode: 'insensitive' };
  }
  if (filter.mood) {
    where.moods = { has: filter.mood };
  }
  if (filter.q) {
    where.OR = [
      { title: { contains: filter.q, mode: 'insensitive' } },
      { artist: { contains: filter.q, mode: 'insensitive' } },
    ];
  }
  return where;
}

@Injectable()
export class TracksRepository {
  constructor(private readonly prisma: PrismaService) {}

  // FINDS
  async findMany(filter: TrackFilter) {
    const where = buildWhere(filter);
    const skip = (filter.page - 1) * filter.limit;

    // Gộp count + findMany trong 1 transaction để giảm round-trip DB (theo Clean-BE convention).
    const [total, items] = await this.prisma.$transaction([
      this.prisma.track.count({ where }),
      this.prisma.track.findMany({
        where,
        skip,
        take: filter.limit,
        orderBy: { syncedAt: 'desc' },
      }),
    ]);

    return { items, total };
  }

  findById(id: string) {
    return this.prisma.track.findUnique({ where: { id } });
  }

  async findDistinctGenres(): Promise<string[]> {
    const rows = await this.prisma.track.findMany({
      where: { genre: { not: null } },
      select: { genre: true },
      distinct: ['genre'],
      orderBy: { genre: 'asc' },
    });
    return rows
      .map((r: { genre: string | null }) => r.genre)
      .filter((g: string | null): g is string => Boolean(g));
  }

  async findDistinctMoods(): Promise<string[]> {
    // Prisma không hỗ trợ DISTINCT trực tiếp trên phần tử của array column (String[]),
    // nên lấy toàn bộ moods rồi dedupe ở tầng ứng dụng. Chấp nhận được ở quy mô catalog hiện tại;
    // nếu catalog lớn lên nhiều, cân nhắc $queryRaw với unnest() cho Postgres.
    const rows = await this.prisma.track.findMany({
      select: { moods: true },
      take: 5000,
    });
    const set = new Set<string>();
    for (const row of rows) {
      for (const mood of row.moods) set.add(mood);
    }
    return Array.from(set).sort();
  }

  findTrending(limit: number) {
    return this.prisma.track.findMany({
      take: limit,
      orderBy: {
        favorites: { _count: 'desc' },
      },
    });
  }
}
