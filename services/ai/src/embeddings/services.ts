import type { NoteUpsertedEventPayload } from '@/embeddings/schemas';

import {
  bulkDeleteNotesAndEmbeddings,
  bulkDeleteOnlyEmbeddings,
  bulkUpsertNoteEmbeddingRecords,
  bulkUpsertNoteRecords,
  getNotesByIds,
} from '@/embeddings/repository';
import { MAX_EMBEDDING_INPUT_LENGTH } from '@/embeddings/constants';
import { MAX_TITLE_LENGTH } from '@/generator';
import { embedText } from '@/lib/ai';

export async function handleNotesUpserted(
  payload: Array<NoteUpsertedEventPayload> | NoteUpsertedEventPayload,
) {
  const items = Array.isArray(payload) ? payload : [payload];
  if (items.length === 0) return;

  const noteIds = items.map((item) => item.noteId);

  const existingNotes = await getNotesByIds(noteIds);
  const existingMap = new Map(existingNotes.map((n) => [n.id, n]));

  const embeddingsToDelete: Array<string> = [];
  const notesToUpsert: typeof items = [];
  const notesNeedingEmbedding: typeof items = [];

  for (const item of items) {
    const { content, trashed, noteId, title, tags, attachmentHash } = item;

    const existing = existingMap.get(noteId);

    // * Luôn luôn upsert record Note để đồng bộ trạng thái trashed / content với Spring Boot
    notesToUpsert.push(item);

    // ! Nếu note bị đưa vào thùng rác HOẶC nội dung rỗng -> Cần xóa Embedding (không xóa Note)
    if (trashed || !content.trim()) {
      embeddingsToDelete.push(noteId);
      continue;
    }

    const hasTitleChanged = (existing?.title ?? null) !== (title ?? null);
    const hasContentChanged = existing?.content !== content;
    const isNewNote = !existing;
    const wasTrashedBefore = existing?.trashed === true;
    const hasTagsChanged =
      JSON.stringify([...(existing?.tags ?? [])].toSorted()) !==
      JSON.stringify([...tags].toSorted());
    const hasAttachmentsChanged = (existing?.attachmentHash ?? null) !== (attachmentHash ?? null);

    // * Chỉ tạo embedding nếu:
    // * - Note mới hoàn toàn
    // * - Title, Content, Tags hoặc Attachments có sự thay đổi
    // * - Note vừa được Restore từ Trash (trước đó embedding đã bị xóa)
    if (
      isNewNote ||
      hasTitleChanged ||
      hasContentChanged ||
      hasTagsChanged ||
      hasAttachmentsChanged ||
      wasTrashedBefore
    ) {
      notesNeedingEmbedding.push(item);
    }
  }

  if (notesToUpsert.length > 0) {
    await bulkUpsertNoteRecords(
      notesToUpsert.map((item) => ({
        createdAt: item.createdAt ?? null,
        updatedAt: item.updatedAt ?? null,
        title: item.title ?? null,
        content: item.content,
        trashed: item.trashed,
        userId: item.userId,
        id: item.noteId,
        tags: item.tags,
        attachmentHash: item.attachmentHash ?? null,
      })),
    );
  }

  if (embeddingsToDelete.length > 0) {
    await bulkDeleteOnlyEmbeddings(embeddingsToDelete);
  }

  if (notesNeedingEmbedding.length > 0) {
    const embeddingResults = await Promise.all(
      notesNeedingEmbedding.map(async (item) => {
        const textParts = item.title ? [item.title, item.content] : [item.content];
        if (item.tags.length > 0) {
          textParts.push(`Tags: ${item.tags.join(', ')}`);
        }
        for (const attachmentText of item.attachmentTexts) {
          textParts.push(attachmentText);
        }
        const textToEmbed = textParts.join('\n');
        const safeContent = textToEmbed.slice(0, MAX_EMBEDDING_INPUT_LENGTH + MAX_TITLE_LENGTH);
        const embedding = await embedText(safeContent);

        return {
          noteId: item.noteId,
          userId: item.userId,
          embedding,
        };
      }),
    );

    await bulkUpsertNoteEmbeddingRecords(embeddingResults);
  }
}

export async function handleNotesDeleted(payload: Array<string> | string) {
  const ids = Array.isArray(payload) ? payload : [payload];
  if (ids.length === 0) return;

  await bulkDeleteNotesAndEmbeddings(ids);
}
