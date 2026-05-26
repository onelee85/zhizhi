import { z } from "zod";

export const subjectSchema = z.enum(["语文", "数学", "英语", "其他"]);
export const taskTypeSchema = z.enum(["作业", "预习", "复习", "错题", "阅读", "背诵", "练习"]);

export const createTaskSchema = z.object({
  childUserId: z.string().min(1),
  subject: subjectSchema,
  taskType: taskTypeSchema,
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  needPhoto: z.boolean().default(true),
  needAiCheck: z.boolean().default(false)
});

export const updateTaskSchema = createTaskSchema
  .omit({ childUserId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

export const submitTaskSchema = z.object({
  completed: z.literal(true),
  imageUrls: z.array(z.string().url()).min(1).max(9),
  childNote: z.string().max(500).optional()
});

export const reviewTaskSchema = z.object({
  reviewResult: z.enum(["pass", "need_resubmit"]),
  comment: z.string().max(500).optional()
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});
