import { useQuery } from '@tanstack/react-query';

import { relatedNotesClient } from '@/features/notes/api/notes.http';
import { RELATED_NOTES_LIMIT } from '@/features/notes/constants';
import { noteKeys } from '@/features/notes/api/notes.api';

export function useRelatedNotes(noteId: string) {
  return useQuery({
    queryKey: [...noteKeys.all, 'related', noteId],
    queryFn: () => relatedNotesClient({ query: { noteId, limit: RELATED_NOTES_LIMIT } }),
  });
}
