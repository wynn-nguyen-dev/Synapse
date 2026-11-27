import type { Note, NotesEmptyVariant } from '@/features/notes/types';
import type { BaseUIEvent } from '@base-ui/react';
import type { ReactNode } from 'react';

import { Fragment } from 'react';

import { m } from '@/paraglide/messages';

import { Sortable, SortableContent, SortableItem } from '@/components/ui/sortable';
import { Button } from '@/components/ui/button';

import { PlusIcon } from 'lucide-react';

import { NotesListEmpty, NotesListCardSkeleton } from '@/features/notes/components';

interface NotesListProps {
  onCreateClick?: (event: BaseUIEvent<React.MouseEvent<HTMLButtonElement>>) => void;
  onReorder?: ((orderedIds: Array<string>) => void) | undefined;
  renderItem: (note: Note) => ReactNode;
  emptyVariant: NotesEmptyVariant;
  loadingCardCount?: number;
  isLoading?: boolean;
  notes: Array<Note>;
}

const GRID_CLASSES = 'grid gap-4 grid-cols-1 @4xl:grid-cols-2 @8xl:grid-cols-3';

export default function NotesList({
  loadingCardCount = 6,
  onCreateClick,
  emptyVariant,
  renderItem,
  onReorder,
  isLoading,
  notes,
}: NotesListProps) {
  if (isLoading) return <NotesListCardSkeleton loadingCardCount={loadingCardCount} />;

  if (notes.length < 1)
    return (
      <NotesListEmpty variant={emptyVariant}>
        {emptyVariant === 'active' && (
          <Button onClick={onCreateClick}>
            <PlusIcon className="h-4 w-4" />
            {m.notes_page_create()}
          </Button>
        )}
      </NotesListEmpty>
    );

  if (!onReorder) {
    return (
      <div className={GRID_CLASSES}>
        {notes.map((note) => (
          <Fragment key={note.id}>{renderItem(note)}</Fragment>
        ))}
      </div>
    );
  }

  return (
    <Sortable
      value={notes}
      getItemValue={(note) => note.id}
      onValueChange={(ordered) => onReorder(ordered.map((note) => note.id))}
      orientation="mixed"
    >
      <SortableContent className={GRID_CLASSES}>
        {notes.map((note) => (
          <SortableItem key={note.id} value={note.id}>
            {renderItem(note)}
          </SortableItem>
        ))}
      </SortableContent>
    </Sortable>
  );
}
