import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { REFRESH_TOKEN_COOKIE } from "../../modules/auth/auth.helpers";

// Guard riêng cho /auth/refresh — KHÔNG dùng Passport 'jwt' strategy vì refresh token
// là chuỗi random (không phải JWT); verify thật (so hash với DB) nằm ở AuthService.
// Guard này chỉ đảm bảo cookie refresh_token tồn tại trước khi vào controller.
@Injectable()
export class RefreshTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!token) {
      throw new UnauthorizedException({
        code: "MISSING_REFRESH_TOKEN",
        message: "Thiếu refresh token, vui lòng đăng nhập lại.",
      });
    }
    return true;
  }
}
