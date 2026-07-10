import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import configuration from "./config/configuration";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./modules/health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { TracksModule } from "./modules/tracks/tracks.module";
import { StationsModule } from "./modules/stations/stations.module";
import { IngestionModule } from "./modules/ingestion/ingestion.module";
import { FavoritesModule } from "./modules/favorites/favorites.module";
import { PlaylistsModule } from "./modules/playlists/playlists.module";
import { CsrfOriginMiddleware } from "./common/middleware/csrf-origin.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100, // giới hạn chung; auth module override chặt hơn qua @Throttle() riêng
      },
    ]),
    ScheduleModule.forRoot(), // cần sẵn cho @Cron ở IngestionModule
    PrismaModule,
    HealthModule,
    AuthModule,
    TracksModule,
    StationsModule,
    IngestionModule,
    FavoritesModule,
    PlaylistsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // bật rate limit thật sự cho toàn app (ThrottlerModule chỉ khai báo cấu hình)
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CsrfOriginMiddleware).forRoutes("*");
  }
}
