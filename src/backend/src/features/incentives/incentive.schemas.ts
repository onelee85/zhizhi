import { z } from "zod";

export const createWishSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional()
}).strict();

export const updateWishSchema = createWishSchema;

export const approveWishSchema = z.object({
  requiredPoints: z.number().int().min(1).max(99999)
}).strict();

export const rejectWishSchema = z.object({
  rejectReason: z.string().trim().min(1).max(500)
}).strict();

export const rejectRedeemSchema = z.object({
  rejectReason: z.string().trim().min(1).max(500)
}).strict();
