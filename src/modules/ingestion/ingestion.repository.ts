import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { NormalizedIngestedTrack } from "./providers/jamendo.provider";

@Injectable()
export class IngestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Gộp check tồn tại của CẢ BATCH thành 1 query duy nhất (thay vì tự query từng track
  // trong loop — đúng nguyên tắc tránh N+1 của Clean-BE). Gọi 1 lần trước khi upsert từng track.
  async findExistingSourceIds(sourceIds: string[]): Promise<Set<string>> {
    if (sourceIds.length === 0) return new Set();
    const rows = await this.prisma.track.findMany({
      where: { sourceProvider: "JAMENDO", sourceId: { in: sourceIds } },
      select: { sourceId: true },
    });
    return new Set(rows.map((r: { sourceId: string }) => r.sourceId));
  }

  // Upsert theo (sourceProvider, sourceId) — tránh trùng lặp khi cron chạy lại nhiều lần.
  // Việc track này MỚI hay không đã xác định trước đó qua findExistingSourceIds, không tự query lại ở đây.
  async upsertTrack(track: NormalizedIngestedTrack): Promise<void> {
    const data = {
      title: track.title,
      artist: track.artist,
      genre: track.genre,
      moods: track.moods,
      durationSec: track.durationSec,
      previewUrl: track.previewUrl,
      downloadUrl: track.downloadUrl,
      thumbnailUrl: track.thumbnailUrl,
      licenseType: track.licenseType,
      licenseUrl: track.licenseUrl,
      commercialSafe: track.commercialSafe,
      tags: track.tags,
    };

    await this.prisma.track.upsert({
      where: {
        sourceProvider_sourceId: {
          sourceProvider: "JAMENDO",
          sourceId: track.sourceId,
        },
      },
      create: {
        sourceProvider: "JAMENDO",
        sourceId: track.sourceId,
        ...data,
      },
      update: {
        ...data,
        syncedAt: new Date(),
      },
    });
  }

  createLog(data: {
    status: string;
    tracksFetched: number;
    tracksNew: number;
    errorMessage?: string;
    startedAt: Date;
    finishedAt: Date;
  }) {
    return this.prisma.ingestionLog.create({
      data: { provider: "JAMENDO", ...data },
    });
  }
}
