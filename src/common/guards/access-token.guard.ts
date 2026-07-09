// Verify access_token cookie, gắn req.user
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

// Bọc Passport strategy 'jwt' (đăng ký ở modules/auth/strategies/jwt.strategy.ts)
// để chuẩn hoá lỗi trả về theo docs/04-api-contract.md.
// Dùng: @UseGuards(AccessTokenGuard) cho mọi route cần đăng nhập
// (auth/me, auth/logout, favorites/*, playlists/* sau này).
@Injectable()
export class AccessTokenGuard extends AuthGuard("jwt") {
  handleRequest<TUser = unknown>(err: unknown, user: TUser | false): TUser {
    if (err || !user) {
      throw new UnauthorizedException({
        code: "UNAUTHENTICATED",
        message: "Vui lòng đăng nhập để tiếp tục.",
      });
    }
    return user;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
