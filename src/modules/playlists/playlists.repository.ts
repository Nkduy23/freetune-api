import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlaylistsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // FINDS
  findByUser(userId: string) {
    return this.prisma.playlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.playlist.findUnique({
      where: { id },
      include: {
        tracks: {
          orderBy: { order: 'asc' },
          include: { track: true },
        },
      },
    });
  }

  countTracks(playlistId: string) {
    return this.prisma.playlistTrack.count({ where: { playlistId } });
  }

  // MUTATIONS
  create(userId: string, data: { name: string; description?: string; isPublic: boolean }) {
    return this.prisma.playlist.create({ data: { userId, ...data } });
  }

  update(id: string, data: { name?: string; description?: string; isPublic?: boolean }) {
    return this.prisma.playlist.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.playlist.delete({ where: { id } });
  }

  // upsert -> thêm 1 track đã có sẵn trong playlist chỉ update lại order, không lỗi trùng khoá.
  addTrack(playlistId: string, trackId: string, order: number) {
    return this.prisma.playlistTrack.upsert({
      where: { playlistId_trackId: { playlistId, trackId } },
      create: { playlistId, trackId, order },
      update: { order },
    });
  }

  removeTrack(playlistId: string, trackId: string) {
    return this.prisma.playlistTrack.deleteMany({ where: { playlistId, trackId } });
  }
}
