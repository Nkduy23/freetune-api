import { z } from 'zod';

export const createPlaylistSchema = z.object({
  name: z.string().trim().min(1, 'Tên playlist không được để trống').max(150),
  description: z.string().trim().max(1000).optional(),
  isPublic: z.boolean().optional().default(false),
});
export type CreatePlaylistDto = z.infer<typeof createPlaylistSchema>;

export const updatePlaylistSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  description: z.string().trim().max(1000).optional(),
  isPublic: z.boolean().optional(),
});
export type UpdatePlaylistDto = z.infer<typeof updatePlaylistSchema>;

export const addTrackToPlaylistSchema = z.object({
  trackId: z.string().trim().min(1),
  order: z.number().int().min(0).optional(),
});
export type AddTrackToPlaylistDto = z.infer<typeof addTrackToPlaylistSchema>;
