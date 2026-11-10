import type { InfiniteData, QueryKey } from '@tanstack/react-query';
import type { PaginatedData } from '@/types/response';
import type { Note } from '@/features/notes/types';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { toast } from 'sonner';

import { m } from '@/paraglide/messages';

import { reorderNotesClient } from '@/features/notes/api/notes.http';
import { noteKeys } from '@/features/notes/api/notes.api';

export interface ReorderNotesContext {
  previous: Array<[QueryKey, InfiniteData<PaginatedData<Note>> | undefined]>;
}

export function useReorderNotes() {
  const queryClient = useQueryClient();

  return useMutation<number, Error, Array<string>, ReorderNotesContext>({
    mutationFn: (noteIds) => reorderNotesClient({ body: { noteIds } }),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: noteKeys.all });
      const previous = queryClient.getQueriesData<InfiniteData<PaginatedData<Note>>>({
        queryKey: noteKeys.infinites(),
      });

      const position = new Map(orderedIds.map((id, index) => [id, index] as const));
      queryClient.setQueriesData<InfiniteData<PaginatedData<Note>>>(
        { queryKey: noteKeys.infinites() },
        (old) => {
          if (!old) return old;
          const size = old.pages[0]?.size;
          if (!size) return old;
          const flat = old.pages.flatMap((page) => page.items);
          const sorted = flat.toSorted(
            (a, b) =>
              (position.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
              (position.get(b.id) ?? Number.MAX_SAFE_INTEGER),
          );
          const pages = [];
          for (let i = 0; i < sorted.length; i += size) {
            const base = old.pages[Math.floor(i / size)];
            if (!base) return old;
            pages.push({ ...base, items: sorted.slice(i, i + size) });
          }
          return { ...old, pages };
        },
      );

      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context) {
        for (const [key, data] of context.previous) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error(m.notes_reorder_failed(), {
        description: m.common_error_connection(),
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
}
