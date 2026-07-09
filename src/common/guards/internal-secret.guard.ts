import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { AppConfig } from '../../config/configuration';

// Bảo vệ endpoint /internal/* (cron trigger đồng bộ nhạc) — đây không phải request từ trình duyệt
// nên không đi qua CsrfOriginMiddleware, dùng secret riêng (INTERNAL_SYNC_SECRET) thay thế.
@Injectable()
export class InternalSecretGuard implements CanActivate {
  constructor(private readonly configService: ConfigService<AppConfig>) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const provided = req.headers['x-internal-secret'];
    const expected = this.configService.get('internalSyncSecret', { infer: true });

    if (!expected || provided !== expected) {
      throw new UnauthorizedException({
        code: 'INVALID_INTERNAL_SECRET',
        message: 'Không có quyền truy cập endpoint nội bộ.',
      });
    }
    return true;
  }
}
