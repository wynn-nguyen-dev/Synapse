import { findRelatedNotes } from '@/search/repository';
import { searchUserNotes } from '@/chat/notes';

const ASK_NOTES_LIMIT = 5;
const SNIPPET_LENGTH = 200;
const SNIPPET_CONTEXT = 60;

export interface NoteSearchResult {
  title: string | null;
  snippet: string;
  noteId: string;
}

export async function askNotes(userId: string, query: string): Promise<Array<NoteSearchResult>> {
  const hits = await searchUserNotes({ userId, query, limit: ASK_NOTES_LIMIT });

  return hits.map((hit) => ({
    snippet: buildSnippet(hit.content, query),
    noteId: hit.id,
    title: hit.title,
  }));
}

export async function relatedNotes(
  userId: string,
  noteId: string,
  limit: number,
): Promise<Array<NoteSearchResult>> {
  const rows = await findRelatedNotes({ userId, noteId, limit });

  return rows.map((row) => ({
    snippet: row.content.slice(0, SNIPPET_LENGTH),
    noteId: row.id,
    title: row.title,
  }));
}

function buildSnippet(content: string, query: string): string {
  const words = query.split(/\s+/).filter((word) => word.length > 2);
  const lowerContent = content.toLowerCase();

  let matchIndex = -1;
  for (const word of words) {
    const index = lowerContent.indexOf(word.toLowerCase());
    if (index !== -1 && (matchIndex === -1 || index < matchIndex)) {
      matchIndex = index;
    }
  }

  if (matchIndex === -1) return content.slice(0, SNIPPET_LENGTH);

  const start = Math.max(0, matchIndex - SNIPPET_CONTEXT);
  return `${start > 0 ? '…' : ''}${content.slice(start, start + SNIPPET_LENGTH)}`;
}
