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

## Trạng thái hiện tại (Phase 3 — done, sẵn sàng qua FE)

- [x] `auth` đầy đủ (register/login/refresh rotation/logout/logout-all/me).
- [x] `tracks`, `stations`, `ingestion` (Jamendo thật).
- [x] `favorites`: `GET/POST/DELETE /me/favorites/:trackId` — idempotent (thích/bỏ thích lặp lại không lỗi).
- [x] `playlists`: `GET/POST /me/playlists`, `GET/PATCH/DELETE /playlists/:id`, `POST/DELETE /playlists/:id/tracks(/:trackId)` — check ownership, playlist private trả `PLAYLIST_NOT_FOUND` cho người lạ (không lộ là có tồn tại).
- [x] `OptionalAccessTokenGuard` mới (common/guards) — cho phép xem playlist public không cần đăng nhập, có đăng nhập thì biết là ai để check quyền.

## Test nhanh Phase 3 (Postman, đã đăng nhập từ trước)

1. `POST /api/me/favorites/<trackId>` → thích 1 bài (lấy trackId từ `GET /api/tracks`).
2. `GET /api/me/favorites` → thấy bài vừa thích.
3. `POST /api/me/playlists` — body `{ "name": "Làm việc buổi sáng" }`.
4. `POST /api/playlists/<playlistId>/tracks` — body `{ "trackId": "<trackId>" }`.
5. `GET /api/playlists/<playlistId>` — không cần cookie vẫn xem được NẾU tạo với `isPublic: true`; nếu `isPublic: false` (mặc định) mà gọi không cookie hoặc cookie của user khác → `PLAYLIST_NOT_FOUND`.

## Ghi chú kiểm thử type (môi trường sandbox của Claude)

Mạng sandbox chặn tải engine binary của Prisma nên `prisma generate` ở đây chỉ ra client rút gọn — vài dòng cảnh báo TypeScript về `Prisma.TrackWhereInput`/`Prisma.PrismaClientKnownRequestError` là do thiếu client đầy đủ ở sandbox, **không phải lỗi code**. Máy bạn có internet đầy đủ nên `pnpm prisma generate` sẽ hết cảnh báo.

## Auth — cách test nhanh (Postman/Thunder Client)

Bật "giữ cookie giữa các request" (cookie jar) trong tool bạn dùng, vì auth dựa hoàn toàn vào cookie httpOnly.

Mọi request POST/PATCH/DELETE cần thêm header:

```
X-Client: freetune-web
```

(nếu không có sẽ bị chặn bởi CSRF middleware — đây là hành vi đúng, không phải bug)

1. `POST /api/auth/register` — body `{ "email": "a@test.com", "password": "12345678", "name": "A" }` → nhận cookie `access_token` + `refresh_token`.
2. `GET /api/auth/me` → trả thông tin user (cần cookie access_token còn hạn).
3. `POST /api/auth/refresh` → cấp cặp cookie mới, cookie cũ bị revoke trong DB.
4. Gọi lại `POST /api/auth/refresh` với cookie **cũ** (trước bước 3) → phải trả lỗi `INVALID_REFRESH_TOKEN` (đúng cơ chế reuse detection — nếu test được điều này nghĩa là rotation hoạt động đúng).
5. `POST /api/auth/logout` → xoá cookie, refresh token cũ không dùng lại được nữa.

## Quy ước

- Mỗi domain: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.validation.ts` (Zod).
- Service không tự throw response HTTP thô — dùng NestJS exception có `code` rõ ràng, `HttpExceptionFilter` lo phần format.
- Không dùng `as any` — xem `docs` gốc phần Clean-BE skill nếu cần nhắc lại quy ước.
