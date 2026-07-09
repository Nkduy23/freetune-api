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

## Trạng thái hiện tại (Phase 2)

- [x] Bootstrap NestJS + cấu trúc thư mục theo Clean-BE convention.
- [x] Prisma schema đầy đủ — **lưu ý: enum `SourceProvider` đã đổi, chỉ còn `JAMENDO`** (bỏ `PIXABAY`, xem `docs/02-data-sources-licensing.md`). Nếu đã migrate trước đó, chạy lại:
  ```bash
  pnpm prisma:migrate:dev -- --name remove_pixabay_provider
  ```
- [x] Global exception filter, response interceptor, Zod validation pipe.
- [x] Health check endpoint.
- [x] Module `auth` đầy đủ (register/login/refresh rotation/logout/logout-all/me).
- [x] Module `tracks`: list (filter genre/mood/commercialOnly/pagination), detail, genres, moods, trending.
- [x] Module `stations`: danh sách station tĩnh + queue tự sinh (loại trừ track đã nghe, shuffle).
- [x] Module `ingestion`: gọi Jamendo API thật, tính `commercialSafe` từ license, cron 12h/lần + endpoint trigger thủ công.
- [ ] Module `favorites`/`playlists` — sang Phase 3.

## Cách test Phase 2 (thứ tự nên làm)

1. Điền `.env`: `JAMENDO_CLIENT_ID` (đăng ký free tại https://devportal.jamendo.com/), `INTERNAL_SYNC_SECRET` (chuỗi tuỳ ý).
2. Chạy `pnpm start:dev`.
3. Trigger đồng bộ nhạc lần đầu (để có dữ liệu thật trước khi test tracks/stations):
   ```
   POST /api/internal/sync/jamendo
   Header: X-Internal-Secret: <giá trị INTERNAL_SYNC_SECRET trong .env>
   ```
   Response trả về `{ tracksFetched, tracksNew, errors }`. Chạy xong kiểm tra `IngestionLog` trong DB (qua DBeaver) nếu muốn chắc chắn.
4. `GET /api/tracks` — danh sách track vừa đồng bộ. Thử thêm query `?mood=lofi&commercialOnly=true`.
5. `GET /api/tracks/genres`, `GET /api/tracks/moods`, `GET /api/tracks/trending`.
6. `GET /api/stations` — danh sách 4 station tĩnh kèm `trackCount`.
7. `GET /api/stations/deep-focus/queue?limit=10` — batch track ngẫu nhiên cho station đó. Gọi lại với `?excludeIds=<id1>,<id2>` để test không bị lặp lại track đã nghe.

## Ghi chú kiểm thử type (môi trường sandbox của Claude)

Lúc code phần này, mạng sandbox của Claude chặn tải engine binary của Prisma (`binaries.prisma.sh`), nên `prisma generate` ở đây chỉ tạo được client rút gọn — 2 dòng cảnh báo TypeScript về `Prisma.TrackWhereInput` là do thiếu client đầy đủ ở sandbox, **không phải lỗi code**. Máy bạn có internet đầy đủ nên `pnpm prisma:generate` sẽ tạo type đúng và hết cảnh báo.

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
