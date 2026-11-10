import z from 'zod/v4';

import { MAX_EMBEDDING_INPUT_LENGTH } from '@/embeddings';

export const generateTitleRequestSchema = z.object({
  content: z
    .string()
    .min(1, 'Nội dung không được để trống')
    .max(
      MAX_EMBEDDING_INPUT_LENGTH,
      `Nội dung không được vượt quá ${MAX_EMBEDDING_INPUT_LENGTH} ký tự`,
    ),
});

export const outputNoteTitleSchema = z.object({
  title: z.string().trim(),
});

export const enrichSuggestionKindSchema = z.enum(['title', 'summary', 'tags', 'todos']);

export type EnrichSuggestionKind = z.infer<typeof enrichSuggestionKindSchema>;

export const enrichNoteRequestSchema = z.object({
  content: z
    .string()
    .min(1, 'Nội dung không được để trống')
    .max(
      MAX_EMBEDDING_INPUT_LENGTH,
      `Nội dung không được vượt quá ${MAX_EMBEDDING_INPUT_LENGTH} ký tự`,
    ),
  noteId: z.uuid().optional(),
});

export const enrichDismissalRequestSchema = z.object({
  noteId: z.uuid(),
  kind: enrichSuggestionKindSchema,
});

export const outputNoteEnrichSchema = z.object({
  title: z.string().trim().optional(),
  summary: z.string().trim().optional(),
  tags: z.array(z.string().trim()).default([]),
  todos: z
    .array(
      z.object({
        text: z.string().trim(),
        due: z.string().nullable().optional(),
      }),
    )
    .default([]),
});

export type NoteEnrichOutput = z.infer<typeof outputNoteEnrichSchema>;
