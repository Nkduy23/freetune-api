// @Cron chạy đồng bộ định kỳ
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { IngestionService } from "./ingestion.service";

@Injectable()
export class IngestionScheduler {
  private readonly logger = new Logger("IngestionScheduler");

  constructor(private readonly ingestionService: IngestionService) {}

  // Mỗi 12 tiếng — đủ để catalog cập nhật dần mà không gọi Jamendo quá thường xuyên
  // (Jamendo free tier có rate limit, xem docs/02-data-sources-licensing.md).
  @Cron(CronExpression.EVERY_12_HOURS)
  async handleScheduledSync() {
    this.logger.log("Bắt đầu đồng bộ Jamendo theo lịch...");
    try {
      const result = await this.ingestionService.syncJamendo();
      this.logger.log(
        `Đồng bộ xong: ${result.tracksFetched} track quét, ${result.tracksNew} track mới, ${result.errors.length} lỗi.`,
      );
    } catch (error) {
      this.logger.error(
        "Đồng bộ theo lịch thất bại",
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
