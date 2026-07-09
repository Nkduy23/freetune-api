// register/login/refresh/logout/logout-all/me
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { loginSchema, registerSchema } from "./auth.validation";
import type { LoginDto, RegisterDto } from "./auth.validation";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AccessTokenGuard } from "../../common/guards/access-token.guard";
import { RefreshTokenGuard } from "../../common/guards/refresh-token.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import {
  clearAuthCookies,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
} from "./auth.helpers";
import type { AppConfig } from "../../config/configuration";

function getRequestMeta(req: Request) {
  return {
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  };
}

// Rate limit chặt cho auth — chống brute-force login và đoán refresh token.
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<AppConfig>,
  ) {}

  @Post("register")
  @Throttle(AUTH_THROTTLE)
  @UsePipes(new ZodValidationPipe(registerSchema))
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.register(
      dto,
      getRequestMeta(req),
    );
    this.setCookies(res, tokens);
    return user;
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  @UsePipes(new ZodValidationPipe(loginSchema))
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.login(
      dto,
      getRequestMeta(req),
    );
    this.setCookies(res, tokens);
    return user;
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_THROTTLE)
  @UseGuards(RefreshTokenGuard)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!rawRefreshToken) {
      throw new UnauthorizedException({
        code: "MISSING_REFRESH_TOKEN",
        message: "Thiếu refresh token.",
      });
    }
    const { user, tokens } = await this.authService.refresh(
      rawRefreshToken,
      getRequestMeta(req),
    );
    this.setCookies(res, tokens);
    return user;
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
    await this.authService.logout(rawRefreshToken);
    clearAuthCookies(res);
    return { success: true };
  }

  @Post("logout-all")
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  async logoutAll(
    @CurrentUser() user: { id: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(user.id);
    clearAuthCookies(res);
    return { success: true };
  }

  @Get("me")
  @UseGuards(AccessTokenGuard)
  async me(@CurrentUser() user: { id: string }) {
    return this.authService.me(user.id);
  }

  private setCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    setAuthCookies(res, tokens, {
      accessTokenTtl:
        this.configService.get("accessTokenTtl", { infer: true }) ?? "15m",
      refreshTokenTtlDays:
        this.configService.get("refreshTokenTtlDays", { infer: true }) ?? 30,
    });
  }
}
