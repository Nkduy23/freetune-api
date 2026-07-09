import { createHash, randomBytes } from "crypto";
import type { Response } from "express";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";
// Giới hạn path để cookie refresh_token KHÔNG bị gửi kèm mọi request khác —
// chỉ gửi khi gọi đúng endpoint refresh, giảm bề mặt tấn công nếu access token bị lộ qua nơi khác.
export const REFRESH_TOKEN_COOKIE_PATH = "/api/auth/refresh";

// Refresh token là chuỗi random (KHÔNG phải JWT) — không cần verify chữ ký,
// chỉ cần đủ ngẫu nhiên (64 byte) và được hash trước khi lưu DB.
export function generateRefreshTokenValue(): string {
  return randomBytes(64).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const DURATION_UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 60 * 60_000,
  d: 24 * 60 * 60_000,
};

// Parse chuỗi dạng "15m", "7d", "1h", "30s" thành mili-giây.
// Viết tay thay vì dùng package `ms` — vài phiên bản của `ms` yêu cầu type string-literal
// (StringValue) rất chặt, gây lỗi TS khó lường tuỳ version cài trên máy khác nhau.
export function parseDurationMs(value: string): number {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(value.trim());
  if (!match) {
    throw new Error(
      `Không parse được thời lượng "${value}" — dùng định dạng vd "15m", "7d".`,
    );
  }
  const [, amountStr, unit] = match;
  return parseInt(amountStr, 10) * DURATION_UNIT_MS[unit];
}

interface CookieConfig {
  accessTokenTtl: string;
  refreshTokenTtlDays: number;
}

// SameSite=None + Secure bắt buộc vì FE (Vercel) và BE (Render) khác domain —
// kể cả lúc dev local (localhost:3000 vs localhost:4000 cũng tính là khác origin).
// Trình duyệt hiện đại vẫn coi localhost là "secure context" nên cookie Secure vẫn hoạt động ở dev.
export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  cfg: CookieConfig,
) {
  res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: parseDurationMs(cfg.accessTokenTtl),
  });

  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: REFRESH_TOKEN_COOKIE_PATH,
    maxAge: cfg.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: REFRESH_TOKEN_COOKIE_PATH });
}
