import { Injectable, NotFoundException } from '@nestjs/common';
import { TracksRepository } from './tracks.repository';
import type { ListTracksQuery } from './tracks.validation';

@Injectable()
export class TracksService {
  constructor(private readonly repo: TracksRepository) {}

  async list(query: ListTracksQuery) {
    const { items, total } = await this.repo.findMany(query);
    return {
      data: items,
      meta: { page: query.page, limit: query.limit, total },
    };
  }

  async getById(id: string) {
    const track = await this.repo.findById(id);
    if (!track) {
      throw new NotFoundException({ code: 'TRACK_NOT_FOUND', message: 'Track không tồn tại.' });
    }
    return track;
  }

  getGenres() {
    return this.repo.findDistinctGenres();
  }

  getMoods() {
    return this.repo.findDistinctMoods();
  }

  getTrending(limit = 10) {
    return this.repo.findTrending(limit);
  }
}
