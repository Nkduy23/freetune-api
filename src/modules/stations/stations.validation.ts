import { z } from "zod";

export const stationQueueQuerySchema = z.object({
  // FE gửi danh sách id đã nghe trong phiên hiện tại, cách nhau bằng dấu phẩy.
  excludeIds: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",").filter(Boolean) : [])),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type StationQueueQuery = z.infer<typeof stationQueueQuerySchema>;
