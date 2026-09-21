import type {
  DismissEnrichSuggestionRequest,
  DismissEnrichSuggestionResponse,
} from '@/features/notes/api/notes.http';

import { useMutation } from '@tanstack/react-query';

import { dismissEnrichSuggestionClient } from '@/features/notes/api/notes.http';

export function useDismissEnrichKind() {
  return useMutation<DismissEnrichSuggestionResponse, Error, DismissEnrichSuggestionRequest>({
    mutationFn: dismissEnrichSuggestionClient,
  });
}
