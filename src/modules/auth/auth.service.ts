// Logic hash password, tạo/rotate token — KHÔNG throw HTTP ở đây
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { AuthRepository } from "./auth.repository";
import { generateRefreshTokenValue, hashToken } from "./auth.helpers";
import type { AppConfig } from "../../config/configuration";
import type { LoginDto, RegisterDto } from "./auth.validation";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

interface RequestMeta {
  userAgent?: string;
  ip?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig>,
  ) {}

  async register(
    dto: RegisterDto,
    meta: RequestMeta,
  ): Promise<{ user: SafeUser; tokens: TokenPair }> {
    const existing = await this.repo.findUserByEmail(dto.email);
    if (existing) {
      throw new ConflictException({
        code: "EMAIL_TAKEN",
        message: "Email đã được sử dụng.",
      });
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.repo.createUser({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    const tokens = await this.issueTokenPair(user.id, meta);
    return { user: this.toSafeUser(user), tokens };
  }

  async login(
    dto: LoginDto,
    meta: RequestMeta,
  ): Promise<{ user: SafeUser; tokens: TokenPair }> {
    const user = await this.repo.findUserByEmail(dto.email);
    // Không tiết lộ "email không tồn tại" vs "sai mật khẩu" — tránh dò email trong hệ thống.
    const invalidCredentialsError = new UnauthorizedException({
      code: "INVALID_CREDENTIALS",
      message: "Email hoặc mật khẩu không đúng.",
    });
    if (!user) throw invalidCredentialsError;

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      dto.password,
    );
    if (!passwordMatches) throw invalidCredentialsError;

    const tokens = await this.issueTokenPair(user.id, meta);
    return { user: this.toSafeUser(user), tokens };
  }

  async refresh(
    rawRefreshToken: string,
    meta: RequestMeta,
  ): Promise<{ user: SafeUser; tokens: TokenPair }> {
    const tokenHash = hashToken(rawRefreshToken);
    const existing = await this.repo.findRefreshTokenByHash(tokenHash);

    const invalid = new UnauthorizedException({
      code: "INVALID_REFRESH_TOKEN",
      message: "Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.",
    });
    if (!existing) throw invalid;

    if (existing.revokedAt) {
      // Token đã bị revoke mà vẫn có người dùng lại -> dấu hiệu bị đánh cắp (reuse detection).
      // Revoke toàn bộ session của user này để chặn kẻ tấn công dùng token đánh cắp được.
      await this.repo.revokeAllUserRefreshTokens(existing.userId);
      throw invalid;
    }

    if (existing.expiresAt < new Date()) {
      throw invalid;
    }

    const user = await this.repo.findUserById(existing.userId);
    if (!user) throw invalid;

    // Rotation: cấp cặp token mới trước, sau đó mới revoke token cũ + nối chain
    // qua replacedByTokenId để giữ lịch sử phát hiện reuse.
    const tokens = await this.issueTokenPair(user.id, meta);
    await this.repo.revokeRefreshToken(existing.id, tokens.refreshTokenId);

    return {
      user: this.toSafeUser(user),
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) return;
    const tokenHash = hashToken(rawRefreshToken);
    const existing = await this.repo.findRefreshTokenByHash(tokenHash);
    if (existing && !existing.revokedAt) {
      await this.repo.revokeRefreshToken(existing.id);
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.repo.revokeAllUserRefreshTokens(userId);
  }

  async me(userId: string): Promise<SafeUser> {
    const user = await this.repo.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException({
        code: "UNAUTHENTICATED",
        message: "Chưa đăng nhập.",
      });
    }
    return this.toSafeUser(user);
  }

  private async issueTokenPair(
    userId: string,
    meta: RequestMeta,
  ): Promise<TokenPair & { refreshTokenId: string }> {
    const accessToken = await this.jwtService.signAsync({ sub: userId });

    const rawRefreshToken = generateRefreshTokenValue();
    const refreshTtlDays =
      this.configService.get("refreshTokenTtlDays", { infer: true }) ?? 30;
    const expiresAt = new Date(
      Date.now() + refreshTtlDays * 24 * 60 * 60 * 1000,
    );

    const record = await this.repo.createRefreshToken({
      userId,
      tokenHash: hashToken(rawRefreshToken),
      expiresAt,
      userAgent: meta.userAgent,
      ip: meta.ip,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      refreshTokenId: record.id,
    };
  }

  private toSafeUser(user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
  }): SafeUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };
  }
}
