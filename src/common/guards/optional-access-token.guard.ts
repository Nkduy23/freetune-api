import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

// Dùng cho route công khai nhưng vẫn muốn biết user hiện tại là ai NẾU đã đăng nhập
// (vd GET /playlists/:id — playlist public ai xem cũng được, playlist private chỉ chủ mới xem).
// Khác AccessTokenGuard ở chỗ: KHÔNG throw khi thiếu/hết hạn cookie — chỉ để req.user = undefined,
// request vẫn được đi tiếp vào controller (canActivate của AuthGuard gốc luôn trả true,
// chỉ có handleRequest quyết định req.user là gì — xem @nestjs/passport source).
@Injectable()
export class OptionalAccessTokenGuard extends AuthGuard("jwt") {
  handleRequest<TUser = unknown>(
    _err: unknown,
    user: TUser | false,
  ): TUser | undefined {
    return user || undefined;
  }
}
