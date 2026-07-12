import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { PlaylistsService } from "./playlists.service";
import {
  addTrackToPlaylistSchema,
  createPlaylistSchema,
  updatePlaylistSchema,
} from "./playlists.validation";
import type {
  AddTrackToPlaylistDto,
  CreatePlaylistDto,
  UpdatePlaylistDto,
} from "./playlists.validation";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { AccessTokenGuard } from "../../common/guards/access-token.guard";
import { OptionalAccessTokenGuard } from "../../common/guards/optional-access-token.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

// LƯU Ý: pipe validate PHẢI gắn ở tham số @Body(...), KHÔNG gắn @UsePipes() ở method —
// @UsePipes() cấp method áp pipe lên MỌI tham số của handler (kể cả @CurrentUser()/@Param()),
// khiến user object hay chuỗi id bị đem validate nhầm theo schema của body và luôn báo lỗi
// "name: Required" dù body gửi lên đã đúng. Đây là bug thật đã gặp phải, sửa xong ở đây.

// Khớp docs/04-api-contract.md: /me/playlists (list/create của chính user) tách riêng
// với /playlists/:id (xem chi tiết/sửa/xoá/quản lý track — cần check ownership).
@Controller("me/playlists")
@UseGuards(AccessTokenGuard)
export class MyPlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.playlistsService.listMine(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body(new ZodValidationPipe(createPlaylistSchema)) dto: CreatePlaylistDto,
  ) {
    return this.playlistsService.create(user.id, dto);
  }
}

@Controller("playlists")
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get(":id")
  @UseGuards(OptionalAccessTokenGuard)
  detail(
    @Param("id") id: string,
    @CurrentUser() user: { id: string } | undefined,
  ) {
    return this.playlistsService.getById(id, user?.id);
  }

  @Patch(":id")
  @UseGuards(AccessTokenGuard)
  update(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body(new ZodValidationPipe(updatePlaylistSchema)) dto: UpdatePlaylistDto,
  ) {
    return this.playlistsService.update(id, user.id, dto);
  }

  @Delete(":id")
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.playlistsService.delete(id, user.id);
  }

  @Post(":id/tracks")
  @UseGuards(AccessTokenGuard)
  addTrack(
    @Param("id") id: string,
    @CurrentUser() user: { id: string },
    @Body(new ZodValidationPipe(addTrackToPlaylistSchema))
    dto: AddTrackToPlaylistDto,
  ) {
    return this.playlistsService.addTrack(id, user.id, dto.trackId, dto.order);
  }

  @Delete(":id/tracks/:trackId")
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  removeTrack(
    @Param("id") id: string,
    @Param("trackId") trackId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.playlistsService.removeTrack(id, user.id, trackId);
  }
}
