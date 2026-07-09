import { z } from 'zod';

// Query string luôn là string trên HTTP -> dùng z.coerce cho number/boolean.
export const listTracksQuerySchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  genre: z.string().trim().min(1).max(100).optional(),
  mood: z.string().trim().min(1).max(100).optional(),
  commercialOnly: z.coerce.boolean().default(true),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type ListTracksQuery = z.infer<typeof listTracksQuerySchema>;

export const trackIdParamSchema = z.object({
  id: z.string().trim().min(1),
});
