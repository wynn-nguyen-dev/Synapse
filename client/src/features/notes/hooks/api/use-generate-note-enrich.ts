import type {
  GenerateNoteEnrichRequest,
  GenerateNoteEnrichResponse,
} from '@/features/notes/api/notes.http';

import { useMutation } from '@tanstack/react-query';

import { toast } from 'sonner';

import { m } from '@/paraglide/messages';

import { generateNoteEnrichClient } from '@/features/notes/api/notes.http';

export function useGenerateNoteEnrich() {
  return useMutation<GenerateNoteEnrichResponse, Error, GenerateNoteEnrichRequest>({
    mutationFn: generateNoteEnrichClient,
    onError: () => {
      toast.error(m.notes_enrich_failed(), {
        description: m.common_error_connection(),
      });
    },
  });
}
