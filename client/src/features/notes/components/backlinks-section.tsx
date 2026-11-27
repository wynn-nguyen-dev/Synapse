import { useNavigate } from '@tanstack/react-router';

import { m } from '@/paraglide/messages';

import { Skeleton } from '@/components/ui/skeleton';

import { useBacklinks } from '@/features/notes/hooks/api';

export default function BacklinksSection({ noteId }: { noteId: string }) {
  const navigate = useNavigate();
  const { data, isLoading } = useBacklinks(noteId);

  const backlinks = data ?? [];
  if (!isLoading && backlinks.length === 0) return null;

  return (
    <section aria-label={m.notes_backlinks_title()} className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {m.notes_backlinks_title()}
      </h3>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        backlinks.map((note) => (
          <button
            key={note.id}
            type="button"
            onClick={() => void navigate({ to: '/notes/$noteId', params: { noteId: note.id } })}
            className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-left hover:bg-muted"
          >
            <span className="block truncate text-sm font-medium">
              {note.title || m.command_palette_note_untitled()}
            </span>
          </button>
        ))
      )}
    </section>
  );
}
