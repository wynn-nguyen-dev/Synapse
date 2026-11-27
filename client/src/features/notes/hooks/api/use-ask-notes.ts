import { useQuery } from '@tanstack/react-query';

import { askNotesClient } from '@/features/notes/api/notes.http';
import { noteKeys } from '@/features/notes/api/notes.api';

export function useAskNotes(query: string) {
  return useQuery({
    queryKey: [...noteKeys.all, 'ask-notes', query],
    queryFn: () => askNotesClient({ body: { query } }),
    enabled: query.trim().length > 1,
  });
}
