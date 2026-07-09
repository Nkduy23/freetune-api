export interface AppConfig {
  port: number;
  corsOrigin: string;
  databaseUrl: string;
  jwtSecret: string;
  accessTokenTtl: string;
  refreshTokenTtlDays: number;
  pixabayApiKey: string;
  jamendoClientId: string;
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  internalSyncSecret: string;
}

// Đọc & ép kiểu biến môi trường về 1 object duy nhất, dùng qua ConfigService.
// Không throw ở đây — validate "có tồn tại hay không" nên làm ở main.ts lúc bootstrap
// để app fail-fast ngay khi thiếu biến quan trọng (JWT_SECRET, DATABASE_URL...).
export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? "4000", 10),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
  refreshTokenTtlDays: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS ?? "30", 10),
  pixabayApiKey: process.env.PIXABAY_API_KEY ?? "",
  jamendoClientId: process.env.JAMENDO_CLIENT_ID ?? "",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  },
  internalSyncSecret: process.env.INTERNAL_SYNC_SECRET ?? "",
});
