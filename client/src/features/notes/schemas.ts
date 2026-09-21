import { z } from 'zod/v4';

import { m } from '@/paraglide/messages';

import {
  NOTE_BULK_ACTIONS,
  NOTE_SORTABLE_FIELDS,
  NOTE_CONTENT_MAX_LENGTH,
} from '@/features/notes/constants';
import { paginationQuerySchema } from '@/schemas';

export const notesQueryParamsSchema = paginationQuerySchema.extend({
  sort: z
    .enum(NOTE_SORTABLE_FIELDS, { message: m.validation_sort_invalid() })
    .default('updatedAt,desc'),
  q: z.string().nullable().default(null),
});

export type NotesQueryParams = z.infer<typeof notesQueryParamsSchema>;

export const noteIdParamSchema = z.object({
  id: z.string().trim().min(1, { message: m.validation_id_required() }),
});

export type NoteIdParams = z.infer<typeof noteIdParamSchema>;

export const noteInputSchema = z.object({
  content: z
    .string()
    .min(1, { message: m.notes_page_toast_content_required() })
    .max(NOTE_CONTENT_MAX_LENGTH, { message: m.validation_content_max() }),
  title: z.string().trim().max(200, { message: m.validation_title_max() }).optional(),
});

export type NoteFormInput = z.input<typeof noteInputSchema>;

export type NoteInputPayload = z.infer<typeof noteInputSchema>;

export const bulkNoteActionsSchema = z.object({
  ids: z
    .array(z.string().min(1, { message: m.validation_id_required() }))
    .min(1, { message: m.validation_ids_required() }),
  action: z.enum(NOTE_BULK_ACTIONS),
});

export type BulkNoteActions = z.infer<typeof bulkNoteActionsSchema>;

export const generateNoteTitleSchema = z.object({
  content: z.string().min(1, { message: m.validation_content_required() }),
});

export type GenerateNoteTitleInput = z.infer<typeof generateNoteTitleSchema>;

export const enrichSuggestionKinds = ['title', 'summary', 'tags', 'todos'] as const;

export type EnrichSuggestionKind = (typeof enrichSuggestionKinds)[number];

export const enrichNoteRequestSchema = z.object({
  content: z
    .string()
    .min(1, { message: m.validation_content_required() })
    .max(NOTE_CONTENT_MAX_LENGTH, { message: m.validation_content_max() }),
  noteId: z.uuid({ message: m.validation_id_required() }).optional(),
});

export type EnrichNoteRequestInput = z.infer<typeof enrichNoteRequestSchema>;

export const enrichDismissalSchema = z.object({
  noteId: z.uuid({ message: m.validation_id_required() }),
  kind: z.enum(enrichSuggestionKinds),
});

export type EnrichDismissalInput = z.infer<typeof enrichDismissalSchema>;

export interface EnrichTodoSuggestion {
  due?: string | null;
  text: string;
}

export interface EnrichSuggestions {
  todos: Array<EnrichTodoSuggestion>;
  tags: Array<string>;
  summary?: string;
  title?: string;
}

export interface AskNotesInput {
  query: string;
}

export interface AskNoteResult {
  title: string | null;
  snippet: string;
  noteId: string;
}

export interface AttachmentDto {
  contentBase64: string;
  createdAt: string;
  filename: string;
  noteId: string;
  id: string;
}

export interface ReorderNotesInput {
  noteIds: Array<string>;
}
