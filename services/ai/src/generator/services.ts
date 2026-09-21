import type { EnrichSuggestionKind, NoteEnrichOutput } from '@/generator/schemas';

import { generateText, Output } from 'ai';
import { and, eq } from 'drizzle-orm';

import {
  ENRICH_TIMEOUT_MS,
  MAX_ENRICH_TAGS,
  MAX_ENRICH_TODOS,
  MAX_OUTPUT_TOKENS_GENERATE_ENRICH,
  MAX_OUTPUT_TOKENS_GENERATE_TITLE,
  MAX_SUMMARY_LENGTH,
  MAX_TAG_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_TODO_LENGTH,
  TEMPERATURE_GENERATE_ENRICH,
  TEMPERATURE_GENERATE_TITLE,
} from '@/generator/constants';
import {
  enrichSuggestionKindSchema,
  outputNoteEnrichSchema,
  outputNoteTitleSchema,
} from '@/generator/schemas';
import { getChatModel, getTitleModel } from '@/providers/ai-studio';
import { enrichDismissals } from '@/database/schema';
import { isRateLimitOrQuota } from '@/lib/retry';
import { db } from '@/database';

export async function generateNoteTitle(content: string) {
  const controller = new AbortController();

  const timeoutPromise = new Promise<string>((resolve) => {
    setTimeout(() => {
      controller.abort();
      resolve('Untitled');
    }, 5_000);
  });

  const aiPromise = (async () => {
    const picked = getTitleModel();
    try {
      const { output } = await generateText({
        instructions:
          'Bạn tạo tiêu đề ngắn gọn cho ghi chú. Chỉ trả về đúng tiêu đề, không giải thích, không dấu ngoặc kép, đúng trọng tâm và theo ngôn ngữ viết của content. TITLE chỉ chứa Text',
        output: Output.object({
          schema: outputNoteTitleSchema,
        }),
        maxOutputTokens: MAX_OUTPUT_TOKENS_GENERATE_TITLE,
        temperature: TEMPERATURE_GENERATE_TITLE,
        model: picked.model,
        prompt: content,
      });

      const cleanTitle = output.title.trim().replace(/^["']|["']$/g, '');

      return cleanTitle || 'Untitled';
    } catch (error) {
      if (isRateLimitOrQuota(error)) picked.reportRateLimit();
      console.error('[GenerateNoteTitle Error]:', error);

      return 'Untitled';
    }
  })();

  return Promise.race([aiPromise, timeoutPromise]);
}

const EMPTY_ENRICH_SUGGESTIONS: NoteEnrichOutput = { tags: [], todos: [] };

export async function generateNoteEnrich(content: string): Promise<NoteEnrichOutput> {
  const controller = new AbortController();

  const timeoutPromise = new Promise<NoteEnrichOutput>((resolve) => {
    setTimeout(() => {
      controller.abort();
      resolve(EMPTY_ENRICH_SUGGESTIONS);
    }, ENRICH_TIMEOUT_MS);
  });

  const aiPromise = (async (): Promise<NoteEnrichOutput> => {
    const picked = getChatModel();
    try {
      const { output } = await generateText({
        instructions:
          'You enrich a personal note. Title, summary, tags and todos must all use the SAME language as the note content. Never invent facts; omit a field rather than guessing. Rules: title is a short title (omit when the note is too short or has no clear topic); summary is 1-2 sentences (omit for very short notes); tags are short topic tags, 1-3 words each; todos are action items explicitly stated or clearly implied, each with text and an optional ISO-date due (or null).',
        output: Output.object({
          schema: outputNoteEnrichSchema,
        }),
        maxOutputTokens: MAX_OUTPUT_TOKENS_GENERATE_ENRICH,
        temperature: TEMPERATURE_GENERATE_ENRICH,
        model: picked.model,
        prompt: content,
      });

      const title = output.title?.trim().slice(0, MAX_TITLE_LENGTH) || undefined;
      const summary = output.summary?.trim().slice(0, MAX_SUMMARY_LENGTH) || undefined;
      const tags = output.tags
        .map((tag) => tag.trim().slice(0, MAX_TAG_LENGTH))
        .filter((tag) => tag.length > 0)
        .slice(0, MAX_ENRICH_TAGS);
      const todos = output.todos
        .map((todo) => ({
          text: todo.text.trim().slice(0, MAX_TODO_LENGTH),
          due: todo.due ?? null,
        }))
        .filter((todo) => todo.text.length > 0)
        .slice(0, MAX_ENRICH_TODOS);

      return { title, summary, tags, todos };
    } catch (error) {
      if (isRateLimitOrQuota(error)) picked.reportRateLimit();
      console.error('[GenerateNoteEnrich Error]:', error);

      return EMPTY_ENRICH_SUGGESTIONS;
    }
  })();

  return Promise.race([aiPromise, timeoutPromise]);
}

export async function getDismissedEnrichKinds(
  userId: string,
  noteId: string,
): Promise<Array<EnrichSuggestionKind>> {
  const rows = await db
    .select({ kind: enrichDismissals.kind })
    .from(enrichDismissals)
    .where(and(eq(enrichDismissals.userId, userId), eq(enrichDismissals.noteId, noteId)));

  const kinds: Array<EnrichSuggestionKind> = [];
  for (const row of rows) {
    const parsed = enrichSuggestionKindSchema.safeParse(row.kind);
    if (parsed.success) kinds.push(parsed.data);
  }
  return kinds;
}

export async function dismissEnrichKind(
  userId: string,
  noteId: string,
  kind: EnrichSuggestionKind,
): Promise<void> {
  await db.insert(enrichDismissals).values({ userId, noteId, kind }).onConflictDoNothing();
}
