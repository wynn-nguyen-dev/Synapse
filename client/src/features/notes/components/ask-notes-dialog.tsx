import type { KeyboardEvent } from 'react';

import { useEffect, useState } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { useDebounce } from '@/hooks/use-debounce';

import { m } from '@/paraglide/messages';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { ASK_NOTES_DEBOUNCE_MS, ASK_NOTES_OPEN_EVENT } from '@/features/notes/constants';
import { useAskNotes } from '@/features/notes/hooks/api';

function readInitialQuery(event: Event): string {
  if (!(event instanceof CustomEvent)) return '';
  const detail: unknown = event.detail;
  if (typeof detail !== 'object' || detail === null || !('query' in detail)) return '';
  return typeof detail.query === 'string' ? detail.query : '';
}

export default function AskNotesDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const debouncedQuery = useDebounce(query, ASK_NOTES_DEBOUNCE_MS);
  const { data, isError, isFetching } = useAskNotes(open ? debouncedQuery : '');

  useEffect(() => {
    const handleOpen = (event: Event) => {
      setQuery(readInitialQuery(event));
      setOpen(true);
    };

    window.addEventListener(ASK_NOTES_OPEN_EVENT, handleOpen);
    return () => {
      window.removeEventListener(ASK_NOTES_OPEN_EVENT, handleOpen);
    };
  }, []);

  const results = data?.results ?? [];
  const showEmpty = !isFetching && debouncedQuery.trim().length > 1 && results.length === 0;

  const goToNote = (noteId: string) => {
    setOpen(false);
    void navigate({ to: '/notes/$noteId', params: { noteId } });
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && results.length > 0) {
      const [first] = results;
      if (first) goToNote(first.noteId);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setQuery('');
        setOpen(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{m.notes_ask_title()}</DialogTitle>
        </DialogHeader>

        <Input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder={m.notes_ask_placeholder()}
          aria-label={m.notes_ask_title()}
        />

        {isError && <p className="text-sm text-destructive">{m.notes_ask_failed()}</p>}

        {showEmpty && <p className="text-sm text-muted-foreground">{m.notes_ask_empty()}</p>}

        {results.length > 0 && (
          <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
            {results.map((result) => (
              <button
                key={result.noteId}
                type="button"
                onClick={() => goToNote(result.noteId)}
                className="rounded-lg px-3 py-2 text-left hover:bg-muted"
              >
                <span className="block truncate text-sm font-medium">
                  {result.title ?? m.command_palette_note_untitled()}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {result.snippet}
                </span>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
