// Check Origin/Referer + header X-Client cho POST/PATCH/DELETE
import { ForbiddenException, Injectable, NestMiddleware } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { NextFunction, Request, Response } from "express";
import type { AppConfig } from "../../config/configuration";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
// Header tuỳ biến mà site khác không thể tự gắn khi gửi request cross-site qua form/img/fetch
// no-cors — chỉ freetune-web (code của chính mình) mới chủ động thêm header này.
const REQUIRED_CLIENT_HEADER = "freetune-web";

// Vì cookie auth bắt buộc SameSite=None (FE/BE khác domain), cần thêm 1 lớp chống CSRF
// cho mọi request thay đổi dữ liệu: check Origin khớp domain FE + header tuỳ biến.
// Đây là compromise hợp lý cho quy mô dự án này, không phải giải pháp CSRF-token đầy đủ.
@Injectable()
export class CsrfOriginMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService<AppConfig>) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (!MUTATING_METHODS.has(req.method)) {
      return next();
    }

    // Endpoint internal (cron trigger sync nhạc) tự bảo vệ bằng INTERNAL_SYNC_SECRET riêng,
    // không phải request từ trình duyệt nên không áp check Origin ở đây.
    if (req.path.startsWith("/api/internal/")) {
      return next();
    }

    const clientHeader = req.headers["x-client"];
    if (clientHeader !== REQUIRED_CLIENT_HEADER) {
      throw new ForbiddenException({
        code: "CSRF_CHECK_FAILED",
        message: "Yêu cầu không hợp lệ.",
      });
    }

    const origin = req.headers.origin;
    const allowedOrigin = this.configService.get("corsOrigin", { infer: true });
    if (origin && origin !== allowedOrigin) {
      throw new ForbiddenException({
        code: "CSRF_CHECK_FAILED",
        message: "Yêu cầu không hợp lệ.",
      });
    }

    next();
  }
}
