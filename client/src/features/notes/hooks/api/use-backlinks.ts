import { useQuery } from '@tanstack/react-query';

import { getBacklinksClient } from '@/features/notes/api/notes.http';
import { noteKeys } from '@/features/notes/api/notes.api';

export function useBacklinks(noteId: string) {
  return useQuery({
    queryKey: [...noteKeys.all, 'backlinks', noteId],
    queryFn: () => getBacklinksClient({ params: { id: noteId } }),
  });
}
