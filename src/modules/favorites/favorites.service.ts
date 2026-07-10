import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FavoritesRepository } from './favorites.repository';

@Injectable()
export class FavoritesService {
  constructor(private readonly repo: FavoritesRepository) {}

  async list(userId: string) {
    const favorites = await this.repo.findByUser(userId);
    return favorites.map((f: { track: unknown }) => f.track);
  }

  async add(userId: string, trackId: string) {
    try {
      await this.repo.add(userId, trackId);
    } catch (error) {
      // P2003 = vi phạm foreign key -> trackId không tồn tại trong bảng Track.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new NotFoundException({ code: 'TRACK_NOT_FOUND', message: 'Track không tồn tại.' });
      }
      throw error;
    }
    return { success: true };
  }

  async remove(userId: string, trackId: string) {
    await this.repo.remove(userId, trackId);
    return { success: true };
  }
}
