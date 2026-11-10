import z from 'zod/v4';

export const askNotesRequestSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, 'Câu hỏi không được để trống')
    .max(500, 'Câu hỏi không được vượt quá 500 ký tự'),
});

export const relatedNotesQuerySchema = z.object({
  noteId: z.uuid(),
  limit: z.coerce.number().int().min(1).max(5).default(2),
});
