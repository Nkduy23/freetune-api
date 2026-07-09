import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // FINDS
  // Lấy 1 batch tracks khớp mood của station, loại trừ các id đã nghe trong phiên (excludeIds),
  // lấy dư ra (limit * 3, tối đa 90) để tầng service shuffle rồi cắt còn đúng `limit`.
  // Không dùng ORDER BY RANDOM() bằng raw SQL để giữ code đơn giản — chấp nhận được ở quy mô
  // catalog hiện tại; nếu catalog lớn hơn nhiều, nên chuyển sang raw query cho hiệu năng tốt hơn.
  findBatchForMoods(moods: string[], excludeIds: string[], limit: number) {
    const take = Math.min(limit * 3, 90);
    return this.prisma.track.findMany({
      where: {
        moods: { hasSome: moods },
        // Không lọc commercialSafe ở đây: đây là nghe nền (streaming), không phải tải về dùng lại —
        // badge license vẫn hiển thị ở UI, chỉ ảnh hưởng lúc user bấm download, không ảnh hưởng lúc nghe.
        ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
      },
      take,
      orderBy: { syncedAt: 'desc' },
    });
  }

  countForMoods(moods: string[]) {
    return this.prisma.track.count({
      where: { moods: { hasSome: moods } },
    });
  }
}
