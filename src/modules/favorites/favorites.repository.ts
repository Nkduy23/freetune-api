import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // FINDS
  findByUser(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: { track: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // MUTATIONS
  // upsert để add-favorite idempotent — bấm yêu thích 2 lần không lỗi, không tạo trùng record.
  add(userId: string, trackId: string) {
    return this.prisma.favorite.upsert({
      where: { userId_trackId: { userId, trackId } },
      create: { userId, trackId },
      update: {},
    });
  }

  // deleteMany thay vì delete — idempotent, bỏ yêu thích 1 bài chưa từng thích cũng không lỗi.
  remove(userId: string, trackId: string) {
    return this.prisma.favorite.deleteMany({ where: { userId, trackId } });
  }
}
