import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PlaylistsRepository } from './playlists.repository';
import type { CreatePlaylistDto, UpdatePlaylistDto } from './playlists.validation';

@Injectable()
export class PlaylistsService {
  constructor(private readonly repo: PlaylistsRepository) {}

  listMine(userId: string) {
    return this.repo.findByUser(userId);
  }

  create(userId: string, dto: CreatePlaylistDto) {
    return this.repo.create(userId, {
      name: dto.name,
      description: dto.description,
      isPublic: dto.isPublic ?? false,
    });
  }

  async getById(id: string, currentUserId: string | undefined) {
    const playlist = await this.repo.findById(id);
    if (!playlist) {
      throw new NotFoundException({ code: 'PLAYLIST_NOT_FOUND', message: 'Playlist không tồn tại.' });
    }
    if (!playlist.isPublic && playlist.userId !== currentUserId) {
      // Trả NOT_FOUND thay vì FORBIDDEN để không tiết lộ sự tồn tại của playlist private
      // cho người lạ (tránh dò được playlist riêng tư của người khác qua id).
      throw new NotFoundException({ code: 'PLAYLIST_NOT_FOUND', message: 'Playlist không tồn tại.' });
    }
    return playlist;
  }

  async update(id: string, userId: string, dto: UpdatePlaylistDto) {
    await this.assertOwnership(id, userId);
    return this.repo.update(id, dto);
  }

  async delete(id: string, userId: string) {
    await this.assertOwnership(id, userId);
    await this.repo.delete(id);
    return { success: true };
  }

  async addTrack(playlistId: string, userId: string, trackId: string, order?: number) {
    await this.assertOwnership(playlistId, userId);
    const resolvedOrder = order ?? (await this.repo.countTracks(playlistId));
    try {
      await this.repo.addTrack(playlistId, trackId, resolvedOrder);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new NotFoundException({ code: 'TRACK_NOT_FOUND', message: 'Track không tồn tại.' });
      }
      throw error;
    }
    return { success: true };
  }

  async removeTrack(playlistId: string, userId: string, trackId: string) {
    await this.assertOwnership(playlistId, userId);
    await this.repo.removeTrack(playlistId, trackId);
    return { success: true };
  }

  private async assertOwnership(playlistId: string, userId: string) {
    const playlist = await this.repo.findById(playlistId);
    if (!playlist) {
      throw new NotFoundException({ code: 'PLAYLIST_NOT_FOUND', message: 'Playlist không tồn tại.' });
    }
    if (playlist.userId !== userId) {
      throw new ForbiddenException({
        code: 'NOT_PLAYLIST_OWNER',
        message: 'Bạn không có quyền chỉnh sửa playlist này.',
      });
    }
    return playlist;
  }
}
