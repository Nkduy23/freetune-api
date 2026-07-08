// Bootstrap Nest app, cookie-parser, CORS, global pipes/filters
import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import type { AppConfig } from "./config/configuration";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<AppConfig>);

  // Fail-fast nếu thiếu biến môi trường bắt buộc — tránh chạy "ngầm" với JWT_SECRET rỗng.
  const jwtSecret = configService.get("jwtSecret", { infer: true });
  const databaseUrl = configService.get("databaseUrl", { infer: true });
  if (!jwtSecret || !databaseUrl) {
    throw new Error(
      "Thiếu JWT_SECRET hoặc DATABASE_URL trong biến môi trường.",
    );
  }

  app.use(cookieParser());

  // credentials: true bắt buộc vì FE/BE khác domain và dùng cookie httpOnly cho auth.
  app.enableCors({
    origin: configService.get("corsOrigin", { infer: true }),
    credentials: true,
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.setGlobalPrefix("api");

  const port = configService.get("port", { infer: true }) ?? 4000;
  await app.listen(port);
  Logger.log(
    `freetune-api đang chạy tại http://localhost:${port}/api`,
    "Bootstrap",
  );
}

bootstrap();
