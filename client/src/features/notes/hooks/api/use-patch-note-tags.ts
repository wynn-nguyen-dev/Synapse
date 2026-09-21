import type { PatchNoteResponse } from '@/features/notes/api/notes.http';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toast } from 'sonner';

import { m } from '@/paraglide/messages';

import { patchNoteClient } from '@/features/notes/api/notes.http';
import { noteKeys } from '@/features/notes/api/notes.api';

export function usePatchNoteTags(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation<PatchNoteResponse, Error, Array<string>>({
    mutationFn: (tags) => patchNoteClient({ params: { id: noteId }, body: { tags } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
      toast.success(m.notes_enrich_tags_saved());
    },
    onError: () => {
      toast.error(m.notes_page_toast_update_failed(), {
        description: m.common_error_connection(),
      });
    },
  });
}
