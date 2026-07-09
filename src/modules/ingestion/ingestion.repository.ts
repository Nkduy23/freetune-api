// Upsert Track theo (sourceProvider, sourceId), tạo IngestionLog
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { NormalizedIngestedTrack } from "./providers/jamendo.provider";

@Injectable()
export class IngestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Upsert theo (sourceProvider, sourceId) — tránh trùng lặp khi cron chạy lại nhiều lần.
  // Trả về true nếu đây là track MỚI (trước đó chưa tồn tại), dùng để ghi thống kê vào IngestionLog.
  async upsertTrackAndReportNew(
    track: NormalizedIngestedTrack,
  ): Promise<boolean> {
    const existing = await this.prisma.track.findUnique({
      where: {
        sourceProvider_sourceId: {
          sourceProvider: "JAMENDO",
          sourceId: track.sourceId,
        },
      },
      select: { id: true },
    });

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

    return !existing;
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
