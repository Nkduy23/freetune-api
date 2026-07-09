import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";

// Chuẩn hoá MỌI lỗi về format { error: { code, message } } theo docs/04-api-contract.md.
// Không bao giờ trả stack trace / chi tiết lỗi nội bộ ra client — chỉ log phía server.
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === "string"
          ? body
          : (((body as Record<string, unknown>)?.message as string) ??
            exception.message);
      const code =
        typeof body === "object" && (body as Record<string, unknown>)?.code
          ? ((body as Record<string, unknown>).code as string)
          : this.defaultCodeFor(status);

      response.status(status).json({ error: { code, message } });
      return;
    }

    // Lỗi không xác định (bug thật, lỗi DB...) — log đầy đủ ở server, trả message chung cho client.
    this.logger.error(exception instanceof Error ? exception.stack : exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Đã có lỗi xảy ra, vui lòng thử lại sau.",
      },
    });
  }

  private defaultCodeFor(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return "BAD_REQUEST";
      case HttpStatus.UNAUTHORIZED:
        return "UNAUTHORIZED";
      case HttpStatus.FORBIDDEN:
        return "FORBIDDEN";
      case HttpStatus.NOT_FOUND:
        return "NOT_FOUND";
      case HttpStatus.TOO_MANY_REQUESTS:
        return "RATE_LIMITED";
      default:
        return "ERROR";
    }
  }
}
