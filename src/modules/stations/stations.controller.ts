// GET /stations, GET /stations/:slug/queue
import { Controller, Get, Param, Query } from "@nestjs/common";
import { StationsService } from "./stations.service";
import { stationQueueQuerySchema } from "./stations.validation";
import type { StationQueueQuery } from "./stations.validation";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";

@Controller("stations")
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Get()
  list() {
    return this.stationsService.list();
  }

  @Get(":slug/queue")
  queue(
    @Param("slug") slug: string,
    @Query(new ZodValidationPipe(stationQueueQuerySchema))
    query: StationQueueQuery,
  ) {
    return this.stationsService.getQueue(slug, query.excludeIds, query.limit);
  }
}
