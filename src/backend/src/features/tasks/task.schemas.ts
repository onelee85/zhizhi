import { z } from "zod";

export const subjectSchema = z.enum(["语文", "数学", "英语", "其他"]);
export const taskTypeSchema = z.enum(["作业", "预习", "复习", "错题", "阅读", "背诵", "练习"]);

export const createTaskSchema = z
  .object({
    childUserId: z.string().min(1).optional(),
    subject: subjectSchema,
    taskType: taskTypeSchema,
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(1000),
    note: z.string().max(500).optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dueTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    needPhoto: z.boolean().default(true),
    rewardPoints: z.number().int().min(0).max(999).default(1)
  })
  .strict();

export const updateTaskSchema = createTaskSchema
  .omit({ childUserId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export const calendarTaskQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/)
});

export const historyTaskQuerySchema = z
  .object({
    childUserId: z.string().min(1).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  })
  .refine((value) => !value.startDate || !value.endDate || value.startDate <= value.endDate, {
    message: "startDate must be before or equal to endDate"
  });

export const submitTaskSchema = z
  .object({
    completed: z.literal(true),
    imageUrls: z
      .array(z.string().regex(/^\/uploads\/photos\/\d+_[a-f0-9]{12}\.(jpg|jpeg|png|webp)$/))
      .max(9)
      .optional()
      .default([]),
    childNote: z.string().max(500).optional()
  })
  .strict();

export const reviewTaskSchema = z
  .object({
    reviewResult: z.enum(["pass", "need_resubmit"]),
    comment: z.string().trim().max(500).optional()
  })
  .strict()
  .refine((value) => value.reviewResult !== "need_resubmit" || Boolean(value.comment), {
    message: "要求补充时必须填写原因",
    path: ["comment"]
  });

export const loginSchema = z
  .object({
    username: z.string().min(1),
    password: z.string().min(1)
  })
  .strict();
