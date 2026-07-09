import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { Strategy } from "passport-jwt";
import type { Request } from "express";
import { AuthRepository } from "../auth.repository";
import { ACCESS_TOKEN_COOKIE } from "../auth.helpers";
import type { AppConfig } from "../../../config/configuration";

// Đọc access token từ cookie httpOnly thay vì header Authorization,
// vì FE không tự quản token — chỉ trình duyệt tự động gửi cookie kèm request.
function extractFromCookie(req: Request): string | null {
  return req?.cookies?.[ACCESS_TOKEN_COOKIE] ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    configService: ConfigService<AppConfig>,
    private readonly authRepository: AuthRepository,
  ) {
    super({
      jwtFromRequest: extractFromCookie,
      ignoreExpiration: false,
      secretOrKey: configService.get("jwtSecret", { infer: true }) ?? "",
    });
  }

  async validate(payload: { sub: string }) {
    const user = await this.authRepository.findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException({
        code: "UNAUTHENTICATED",
        message: "Tài khoản không tồn tại.",
      });
    }
    // Giá trị return ở đây sẽ được Passport gắn vào req.user.
    return { id: user.id, email: user.email };
  }
}
