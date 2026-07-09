import { Module } from "@nestjs/common";
import { IngestionController } from "./ingestion.controller";
import { IngestionService } from "./ingestion.service";
import { IngestionRepository } from "./ingestion.repository";
import { IngestionScheduler } from "./ingestion.scheduler";

@Module({
  controllers: [IngestionController],
  providers: [IngestionService, IngestionRepository, IngestionScheduler],
})
export class IngestionModule {}
