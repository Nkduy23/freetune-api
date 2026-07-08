import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

// @Global để mọi module khác dùng PrismaService mà không cần import PrismaModule lặp lại.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
