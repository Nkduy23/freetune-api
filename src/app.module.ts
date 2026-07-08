// Import toàn bộ modules
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import configuration from "./config/configuration";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./modules/health/health.module";

// Modules sẽ thêm dần theo Phase 1 → Phase 3:
// AuthModule, UsersModule, TracksModule, StationsModule, FavoritesModule,
// PlaylistsModule, IngestionModule — import vào đây khi code xong từng cái.
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100, // giới hạn chung; auth module sẽ có limit riêng chặt hơn
      },
    ]),
    ScheduleModule.forRoot(), // cần sẵn cho @Cron ở IngestionModule sau này
    PrismaModule,
    HealthModule,
  ],
})
export class AppModule {}
