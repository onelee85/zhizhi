import { z } from "zod";

export const mvpMetricsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(30).default(14)
}).strict();
