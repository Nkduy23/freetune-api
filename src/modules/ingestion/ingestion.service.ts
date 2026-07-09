// Điều phối gọi provider + upsert Track + ghi IngestionLog
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IngestionRepository } from "./ingestion.repository";
import { fetchJamendoTracksByTag } from "./providers/jamendo.provider";
import type { AppConfig } from "../../config/configuration";

// Danh sách tag dùng để quét Jamendo — khớp với moods dùng ở stations.config.ts.
// Thêm mood mới ở stations.config.ts thì nên thêm tag tương ứng ở đây để có dữ liệu thật.
const INGESTION_TAGS = [
  "focus",
  "instrumental",
  "ambient",
  "chill",
  "lounge",
  "lofi",
  "upbeat",
  "energetic",
  "cinematic",
  "corporate",
];

const TRACKS_PER_TAG = 20;

@Injectable()
export class IngestionService {
  private readonly logger = new Logger("IngestionService");

  constructor(
    private readonly repo: IngestionRepository,
    private readonly configService: ConfigService<AppConfig>,
  ) {}

  async syncJamendo(): Promise<{
    tracksFetched: number;
    tracksNew: number;
    errors: string[];
  }> {
    const startedAt = new Date();
    const clientId = this.configService.get("jamendoClientId", { infer: true });

    if (!clientId) {
      const finishedAt = new Date();
      await this.repo.createLog({
        status: "failed",
        tracksFetched: 0,
        tracksNew: 0,
        errorMessage: "Thiếu JAMENDO_CLIENT_ID trong biến môi trường.",
        startedAt,
        finishedAt,
      });
      throw new Error("Thiếu JAMENDO_CLIENT_ID trong biến môi trường.");
    }

    let tracksFetched = 0;
    let tracksNew = 0;
    const errors: string[] = [];

    // Chạy TUẦN TỰ từng tag (không Promise.all) để tôn trọng rate limit của Jamendo,
    // tránh bị họ chặn IP vì gọi dồn dập cùng lúc.
    for (const tag of INGESTION_TAGS) {
      try {
        const tracks = await fetchJamendoTracksByTag(
          clientId,
          tag,
          TRACKS_PER_TAG,
        );
        for (const track of tracks) {
          const isNew = await this.repo.upsertTrackAndReportNew(track);
          tracksFetched += 1;
          if (isNew) tracksNew += 1;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Lỗi khi đồng bộ tag "${tag}": ${message}`);
        errors.push(`${tag}: ${message}`);
      }
    }

    const finishedAt = new Date();
    const status =
      errors.length === 0
        ? "success"
        : errors.length < INGESTION_TAGS.length
          ? "partial"
          : "failed";

    await this.repo.createLog({
      status,
      tracksFetched,
      tracksNew,
      errorMessage: errors.length > 0 ? errors.join(" | ") : undefined,
      startedAt,
      finishedAt,
    });

    return { tracksFetched, tracksNew, errors };
  }
}
