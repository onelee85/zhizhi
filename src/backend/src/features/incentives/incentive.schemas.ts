import { z } from "zod";

export const createWishSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional()
});

export const updateWishSchema = createWishSchema;

export const approveWishSchema = z.object({
  requiredPoints: z.number().int().min(1).max(99999)
});

export const rejectWishSchema = z.object({
  rejectReason: z.string().max(500).optional()
});
