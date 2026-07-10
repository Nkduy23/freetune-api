import { Module } from '@nestjs/common';
import { MyPlaylistsController, PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';
import { PlaylistsRepository } from './playlists.repository';

@Module({
  controllers: [MyPlaylistsController, PlaylistsController],
  providers: [PlaylistsService, PlaylistsRepository],
})
export class PlaylistsModule {}
