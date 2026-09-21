import { inArray, sql } from 'drizzle-orm';

import { noteEmbeddings, notes } from '@/database/schema';
import { db } from '@/database';

export type UpsertNoteParams = {
  attachmentHash: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  title: string | null;
  tags: Array<string>;
  trashed: boolean;
  content: string;
  userId: string;
  id: string;
};

export type UpsertNoteEmbeddingParams = {
  embedding: Array<number> | null;
  noteId: string;
  userId: string;
};

export async function getNotesByIds(noteIds: Array<string>) {
  if (noteIds.length === 0) return [];

  return db
    .select({
      content: notes.content,
      trashed: notes.trashed,
      title: notes.title,
      id: notes.id,
      tags: notes.tags,
      attachmentHash: notes.attachmentHash,
    })
    .from(notes)
    .where(inArray(notes.id, noteIds));
}

export async function bulkUpsertNoteRecords(dataList: Array<UpsertNoteParams>) {
  if (dataList.length === 0) return;

  return db
    .insert(notes)
    .values(
      dataList.map((data) => ({
        createdAt: data.createdAt ? new Date(data.createdAt) : null,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : null,
        content: data.content,
        trashed: data.trashed,
        userId: data.userId,
        title: data.title,
        id: data.id,
        tags: data.tags,
        attachmentHash: data.attachmentHash,
      })),
    )
    .onConflictDoUpdate({
      set: {
        createdAt: sql`EXCLUDED.created_at`,
        updatedAt: sql`EXCLUDED.updated_at`,
        content: sql`EXCLUDED.content`,
        trashed: sql`EXCLUDED.trashed`,
        title: sql`EXCLUDED.title`,
        tags: sql`EXCLUDED.tags`,
        attachmentHash: sql`EXCLUDED.attachment_hash`,
      },
      target: notes.id,
    });
}

export async function bulkDeleteOnlyEmbeddings(noteIds: Array<string>) {
  if (noteIds.length === 0) return;

  return db.delete(noteEmbeddings).where(inArray(noteEmbeddings.noteId, noteIds));
}

export async function bulkUpsertNoteEmbeddingRecords(dataList: Array<UpsertNoteEmbeddingParams>) {
  if (dataList.length === 0) return;

  return db
    .insert(noteEmbeddings)
    .values(
      dataList.map((data) => ({
        embedding: data.embedding,
        noteId: data.noteId,
        userId: data.userId,
      })),
    )
    .onConflictDoUpdate({
      set: {
        embedding: sql`EXCLUDED.embedding`,
      },
      target: noteEmbeddings.noteId,
    });
}

export async function bulkDeleteNotesAndEmbeddings(noteIds: Array<string>) {
  if (noteIds.length === 0) return;

  return db.transaction(async (tx) => {
    await tx.delete(noteEmbeddings).where(inArray(noteEmbeddings.noteId, noteIds));
    await tx.delete(notes).where(inArray(notes.id, noteIds));
  });
}
