import { Controller, Get, Param, Query } from '@nestjs/common';
import { TracksService } from './tracks.service';
import { listTracksQuerySchema } from './tracks.validation';
import type { ListTracksQuery } from './tracks.validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('tracks')
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @Get()
  list(@Query(new ZodValidationPipe(listTracksQuerySchema)) query: ListTracksQuery) {
    return this.tracksService.list(query);
  }

  @Get('genres')
  genres() {
    return this.tracksService.getGenres();
  }

  @Get('moods')
  moods() {
    return this.tracksService.getMoods();
  }

  @Get('trending')
  trending(@Query('limit') limitRaw?: string) {
    const limit = Math.min(Math.max(parseInt(limitRaw ?? '10', 10) || 10, 1), 30);
    return this.tracksService.getTrending(limit);
  }

  // Đặt SAU 'genres'/'moods'/'trending' — nếu đặt trước, Nest sẽ match nhầm các route
  // tĩnh đó vào :id vì cùng là GET /tracks/*.
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.tracksService.getById(id);
  }
}
