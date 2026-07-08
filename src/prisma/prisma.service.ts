// PrismaClient wrapper, onModuleInit/onModuleDestroy
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

// Wrapper mỏng quanh PrismaClient để quản lý vòng đời kết nối theo Nest lifecycle.
// Mọi repository trong các module khác inject PrismaService này, không tự new PrismaClient.
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
