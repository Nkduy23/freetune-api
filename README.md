# freetune-api

Backend NestJS cho freetune — xem toàn bộ quyết định kiến trúc ở folder `docs/` (repo riêng đã gửi trước đó).

## Setup lần đầu

```bash
corepack enable        # nếu máy chưa bật pnpm qua corepack
pnpm install
cp .env.example .env    # điền DATABASE_URL (Neon), JWT_SECRET, PIXABAY_API_KEY, JAMENDO_CLIENT_ID...
pnpm prisma:generate
pnpm prisma:migrate:dev -- --name init
pnpm start:dev
```

Health check: `GET http://localhost:4000/api/health`

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
