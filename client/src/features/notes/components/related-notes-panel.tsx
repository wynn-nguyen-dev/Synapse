import { useNavigate } from '@tanstack/react-router';

import { m } from '@/paraglide/messages';

import { Skeleton } from '@/components/ui/skeleton';

import { useRelatedNotes } from '@/features/notes/hooks/api';

export default function RelatedNotesPanel({ noteId }: { noteId: string }) {
  const navigate = useNavigate();
  const { data, isLoading } = useRelatedNotes(noteId);

  const results = data?.results ?? [];
  if (!isLoading && results.length === 0) return null;

  return (
    <section aria-label={m.notes_related_title()} className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {m.notes_related_title()}
      </h3>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : (
        results.map((result) => (
          <button
            key={result.noteId}
            type="button"
            onClick={() =>
              void navigate({ to: '/notes/$noteId', params: { noteId: result.noteId } })
            }
            className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-left hover:bg-muted"
          >
            <span className="block truncate text-sm font-medium">
              {result.title ?? m.command_palette_note_untitled()}
            </span>
            <span className="block truncate text-xs text-muted-foreground">{result.snippet}</span>
          </button>
        ))
      )}
    </section>
  );
}
