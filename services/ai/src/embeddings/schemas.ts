import z from 'zod/v4';

export const noteUpsertedEventSchema = z.object({
  trashed: z.boolean().default(false),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  title: z.string().nullable(),
  content: z.string(),
  userId: z.string(),
  noteId: z.uuid(),
  tags: z.array(z.string()).default([]),
  attachmentTexts: z.array(z.string()).default([]),
  attachmentHash: z.string().nullable().default(null),
});

export type NoteUpsertedEventPayload = z.infer<typeof noteUpsertedEventSchema>;

export const noteBulkUpsertedEventSchema = z.object({
  notes: z.array(noteUpsertedEventSchema),
});

export const noteDeletedEventSchema = z.object({
  noteId: z.uuid(),
});

export const noteBulkDeletedEventSchema = z.object({
  noteIds: z.array(z.uuid()),
});
