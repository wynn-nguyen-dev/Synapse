import { sql } from 'drizzle-orm';

import { db } from '@/database';

export interface RelatedNoteRow extends Record<string, unknown> {
  title: string | null;
  content: string;
  id: string;
}

/**
 * Cosine-similar notes to the anchor note's embedding (same user, excludes
 * self, only non-trashed mirror rows). Empty when the anchor has no embedding.
 */
export async function findRelatedNotes({
  limit,
  noteId,
  userId,
}: {
  noteId: string;
  userId: string;
  limit: number;
}): Promise<Array<RelatedNoteRow>> {
  const relatedQuery = sql`
    SELECT n.id, n.title, n.content
    FROM note_embeddings anchor
    JOIN note_embeddings e ON e.user_id = anchor.user_id AND e.note_id <> anchor.note_id
    JOIN notes n ON n.id = e.note_id AND n.trashed = false
    WHERE anchor.note_id = ${noteId} AND anchor.user_id = ${userId}
    ORDER BY e.embedding <=> anchor.embedding
    LIMIT ${limit};
  `;

  try {
    const result = await db.execute<RelatedNoteRow>(relatedQuery);

    return result.rows;
  } catch (error) {
    console.error('[findRelatedNotes] Query error:', error);
    return [];
  }
}
