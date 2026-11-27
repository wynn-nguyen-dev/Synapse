import type { BulkNoteAction } from '@/features/notes/constants';
import type { Note, NoteViewMode } from '@/features/notes/types';

import { useEffect, useRef, useState } from 'react';

import { m } from '@/paraglide/messages';
import { cn } from '@/lib/utils';

import {
  ActionBar,
  ActionBarGroup,
  ActionBarItem,
  ActionBarSeparator,
} from '@/components/ui/action-bar';

import {
  PinIcon,
  StarIcon,
  Trash2Icon,
  XIcon,
  RotateCcwIcon,
  Undo2Icon,
  ArchiveIcon,
} from 'lucide-react';

interface NotesBulkActionsProps {
  onBulkAction: (action: BulkNoteAction) => void;
  onClearSelection: () => void;
  selectedIds: Set<string>;
  viewMode?: NoteViewMode;
  notes: Array<Note>;
}

const EXIT_ANIMATION_DURATION = 250;

export default function NotesBulkActions({
  onClearSelection,
  onBulkAction,
  selectedIds,
  viewMode,
  notes,
}: NotesBulkActionsProps) {
  const selectedNotes = notes.filter((note) => selectedIds.has(note.id));
  const selectedTotal = selectedNotes.length;

  const majorityPinned = selectedNotes.filter((note) => note.pinned).length > selectedTotal / 2;
  const majorityFavorited =
    selectedNotes.filter((note) => note.favorite).length > selectedTotal / 2;
  const majorityArchived = selectedNotes.filter((note) => note.archived).length > selectedTotal / 2;

  const pinAction: BulkNoteAction = majorityPinned ? 'UNPIN' : 'PIN';
  const pinLabel = majorityPinned ? m.notes_bulk_unpin() : m.notes_bulk_pin();

  const favoriteAction: BulkNoteAction = majorityFavorited ? 'UNFAVORITE' : 'FAVORITE';
  const favoriteLabel = majorityFavorited ? m.notes_bulk_unfavorite() : m.notes_bulk_favorite();

  const archiveAction: BulkNoteAction = majorityArchived ? 'UNARCHIVE' : 'ARCHIVE';
  const archiveLabel = majorityArchived ? m.notes_bulk_unarchive() : m.notes_bulk_archive();

  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (selectedTotal > 0 && prevCountRef.current === 0) {
      setClosing(false);
      setVisible(true);
    } else if (selectedTotal === 0 && prevCountRef.current > 0) {
      setClosing(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, EXIT_ANIMATION_DURATION);
      prevCountRef.current = 0;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = selectedTotal;
    return undefined;
  }, [selectedTotal]);

  if (!visible) return null;

  return (
    <ActionBar
      open={visible}
      className={cn(
        'rounded-xl border-border bg-muted/30 px-6 py-2',
        closing && 'opacity-0 transition-all duration-250 ease-in-out',
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
          {selectedIds.size}
        </div>
        <span className="text-sm font-medium">
          {m.notes_batch_selected({ count: selectedIds.size })}
        </span>
      </div>

      <ActionBarGroup>
        {viewMode === 'trash' ? (
          <>
            <ActionBarItem
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-xs cursor-pointer"
              onClick={() => onBulkAction('RESTORE')}
            >
              <RotateCcwIcon className="size-3.5" />
              <span className="hidden sm:inline">{m.notes_bulk_restore()}</span>
            </ActionBarItem>

            <ActionBarItem
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-xs text-destructive hover:text-destructive cursor-pointer"
              onClick={() => onBulkAction('DELETE_PERMANENT')}
            >
              <XIcon className="size-3.5" />
              <span className="hidden sm:inline">{m.notes_bulk_delete_permanent()}</span>
            </ActionBarItem>
          </>
        ) : (
          <>
            {viewMode !== 'archive' && (
              <>
                <ActionBarItem
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-1.5 text-xs cursor-pointer"
                  onClick={() => onBulkAction(pinAction)}
                >
                  <PinIcon className="size-3.5" />
                  <span className="hidden sm:inline">{pinLabel}</span>
                </ActionBarItem>

                <ActionBarItem
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-1.5 text-xs cursor-pointer"
                  onClick={() => onBulkAction(favoriteAction)}
                >
                  <StarIcon className="size-3.5" />
                  <span className="hidden sm:inline">{favoriteLabel}</span>
                </ActionBarItem>
              </>
            )}

            <ActionBarItem
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-xs cursor-pointer"
              onClick={() => onBulkAction(archiveAction)}
            >
              {majorityArchived ? (
                <Undo2Icon className="size-3.5" />
              ) : (
                <ArchiveIcon className="size-3.5" />
              )}
              <span className="hidden sm:inline">{archiveLabel}</span>
            </ActionBarItem>

            <ActionBarItem
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-xs text-yellow-600 hover:text-yellow-600 dark:text-yellow-300 dark:hover:text-yellow-300 cursor-pointer"
              onClick={() => onBulkAction('TRASH')}
            >
              <Trash2Icon className="size-3.5" />
              <span className="hidden sm:inline">{m.notes_bulk_move_to_trash()}</span>
            </ActionBarItem>
          </>
        )}

        <ActionBarSeparator />

        <ActionBarItem
          variant="ghost"
          size="icon-sm"
          className="size-9 cursor-pointer"
          onClick={onClearSelection}
        >
          <XIcon className="size-4" />
        </ActionBarItem>
      </ActionBarGroup>
    </ActionBar>
  );
}
