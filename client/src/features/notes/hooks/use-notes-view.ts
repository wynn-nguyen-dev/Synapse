import type { NotesQueryParams } from '@/features/notes/schemas';
import type { NoteViewMode } from '@/features/notes/types';

import { useMemo } from 'react';

import { useNavigate, useSearch } from '@tanstack/react-router';

import { useMultiSelect } from '@/hooks/use-multi-select';

import {
  DEFAULT_NOTES_QUERY_PARAMS,
  NOTE_VIEW_CONFIG,
  openQuickCapture,
} from '@/features/notes/constants';
import { useEmptyTrash, useInfiniteNotes, useNotesBulkAction } from '@/features/notes/hooks/api';
import { useReorderNotes } from '@/features/notes/hooks/api/use-reorder-notes';

export function useNotesView(viewMode: NoteViewMode) {
  const navigate = useNavigate();
  const search = useSearch({ from: '/_app/notes/_list' });
  const { q: query, sort } = search;

  // 1. Config & Param Calculations
  const { filters: apiFilters, emptyVariant, description, title } = NOTE_VIEW_CONFIG[viewMode];

  const isDefaultSort = sort === DEFAULT_NOTES_QUERY_PARAMS.sort;
  const apiParams = {
    ...search,
    ...apiFilters,
    sort:
      viewMode === 'active'
        ? isDefaultSort
          ? ['pinned,desc', 'sortOrder,asc', 'updatedAt,desc']
          : ['pinned,desc', sort]
        : [sort],
  };

  const { page, ...stableParams } = apiParams;

  const { isFetchingNextPage, fetchNextPage, hasNextPage, isLoading, data } = useInfiniteNotes(
    stableParams,
    page,
  );
  const notes = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const totalElements = data?.pages[0]?.totalElements ?? 0;

  const multiSelect = useMultiSelect();

  // 3. Bulk & Trash Mutations
  const { executeBulkAction } = useNotesBulkAction(multiSelect.selectedIds, {
    onSuccess: () => multiSelect.clearSelection(),
  });

  const { executeEmptyTrash } = useEmptyTrash({
    onSuccess: () => multiSelect.clearSelection(),
  });

  const { mutate: reorderNotes } = useReorderNotes();

  // 4. Actions / Navigation Handlers
  const changeSort = (newSort?: NotesQueryParams['sort']) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        sort: newSort,
        page: 1,
      }),
      to: '.',
    });
  };

  const resolvedEmptyVariant = query ? 'no-results' : emptyVariant;
  const isBulkActive = multiSelect.selectedCount > 0;
  const reorderable = viewMode === 'active' && isDefaultSort && !query && !isBulkActive;

  return {
    config: {
      description: description(String(totalElements)),
      emptyVariant: resolvedEmptyVariant,
      title: title(),
    },
    actions: {
      executeBulkAction,
      executeEmptyTrash,
      openQuickCapture,
      changeSort,
      reorder: reorderNotes,
    },
    infinite: {
      isFetchingNextPage,
      fetchNextPage,
      hasNextPage,
    },
    data: {
      totalElements,
      notes,
    },
    state: {
      isBulkActive,
      reorderable,
      sort,
    },
    status: {
      isLoading,
    },
    selection: multiSelect,
  };
}
