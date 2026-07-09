// Logic loại trừ excludeIds, trộn ngẫu nhiên có kiểm soát
import { Injectable, NotFoundException } from "@nestjs/common";
import { STATIONS, findStationBySlug } from "./stations.config";
import { StationsRepository } from "./stations.repository";

// Fisher-Yates — shuffle tại chỗ, đủ dùng cho batch nhỏ (tối đa 90 phần tử).
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

@Injectable()
export class StationsService {
  constructor(private readonly repo: StationsRepository) {}

  async list() {
    const withCounts = await Promise.all(
      STATIONS.map(async (station) => ({
        ...station,
        trackCount: await this.repo.countForMoods(station.moods),
      })),
    );
    return withCounts;
  }

  async getQueue(slug: string, excludeIds: string[], limit: number) {
    const station = findStationBySlug(slug);
    if (!station) {
      throw new NotFoundException({
        code: "STATION_NOT_FOUND",
        message: "Station không tồn tại.",
      });
    }

    const batch = await this.repo.findBatchForMoods(
      station.moods,
      excludeIds,
      limit,
    );
    return shuffle(batch).slice(0, limit);
  }
}
