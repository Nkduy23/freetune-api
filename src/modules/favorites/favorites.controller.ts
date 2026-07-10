import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('me/favorites')
@UseGuards(AccessTokenGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.favoritesService.list(user.id);
  }

  @Post(':trackId')
  @HttpCode(HttpStatus.OK)
  add(@CurrentUser() user: { id: string }, @Param('trackId') trackId: string) {
    return this.favoritesService.add(user.id, trackId);
  }

  @Delete(':trackId')
  @HttpCode(HttpStatus.OK)
  remove(@CurrentUser() user: { id: string }, @Param('trackId') trackId: string) {
    return this.favoritesService.remove(user.id, trackId);
  }
}
