import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { IngestionService } from "./ingestion.service";
import { InternalSecretGuard } from "../../common/guards/internal-secret.guard";

// Base path thực tế: /api/internal/sync/jamendo (global prefix 'api' set ở main.ts).
// CsrfOriginMiddleware đã có exception cho path bắt đầu bằng /api/internal/.
@Controller("internal/sync")
@UseGuards(InternalSecretGuard)
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post("jamendo")
  @HttpCode(HttpStatus.OK)
  syncJamendo() {
    return this.ingestionService.syncJamendo();
  }
}
