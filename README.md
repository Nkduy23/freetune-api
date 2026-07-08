# freetune-api

Backend NestJS cho freetune — xem toàn bộ quyết định kiến trúc ở folder `docs/` (repo riêng đã gửi trước đó).

## Setup lần đầu (local dev — dùng Postgres qua Docker, KHÔNG cần Neon lúc dev local)

```bash
corepack enable        # nếu máy chưa bật pnpm qua corepack
pnpm install
cp .env.example .env    # giữ nguyên DATABASE_URL dòng "LOCAL DEV", điền JWT_SECRET/PIXABAY_API_KEY/JAMENDO_CLIENT_ID sau
docker compose up -d    # chạy Postgres local (postgres:16-alpine), map cổng 5432
pnpm prisma:generate
pnpm prisma:migrate:dev -- --name init
pnpm start:dev
```

Health check: `GET http://localhost:4000/api/health`

### Kết nối DBeaver (xem/sửa dữ liệu local trực quan)

- Host: `localhost`, Port: `5432`
- Database: `freetune_dev`
- Username: `freetune` / Password: `freetune`
- (Đúng như trong `docker-compose.yml` — đổi ở cả 2 nơi nếu muốn dùng giá trị khác.)

### Dừng / xoá DB local

```bash
docker compose down          # dừng container, giữ lại data (volume)
docker compose down -v       # dừng + xoá luôn data — dùng khi muốn migrate lại từ đầu
```

> **Production**: đổi `DATABASE_URL` trong biến môi trường Render sang connection string Neon (xem `docs/06-deployment.md`). Không cần Docker khi deploy — Render chỉ chạy code Node, DB nằm ở Neon.

## Trạng thái hiện tại (Phase 1 — đang làm)

- [x] Bootstrap NestJS + cấu trúc thư mục theo Clean-BE convention.
- [x] Prisma schema đầy đủ (User, RefreshToken, Track, Favorite, Playlist, PlaylistTrack, IngestionLog).
- [x] Global exception filter, response interceptor, Zod validation pipe.
- [x] Health check endpoint.
- [ ] Module `auth` (register/login/refresh/logout/logout-all) — đang code tiếp.
- [ ] `common/guards`, `common/middleware` (CSRF origin check).

## Quy ước

- Mỗi domain: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.validation.ts` (Zod).
- Service không tự throw HTTP exception ở tầng service khi có thể tránh — ném lỗi có type rõ, controller/exception filter xử lý format response.
- Không dùng `as any` — xem `docs` gốc phần Clean-BE skill nếu cần nhắc lại quy ước.
