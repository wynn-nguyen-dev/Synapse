import type { EnrichSuggestionKind } from '@/features/notes/schemas';

import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import { m } from '@/paraglide/messages';

import { NOTE_ENRICH_REQUEST_EVENT } from '@/components/shared/editor/lexical-keyboard-shortcuts';

import { Shimmer } from '@/components/ai-elements/shimmer';

import { Badge } from '@/components/ui/badge';

import {
  useDismissEnrichKind,
  useGenerateNoteEnrich,
  usePatchNoteTags,
} from '@/features/notes/hooks/api';

import EnrichSuggestionRow from './enrich-suggestion-row';

interface EnrichSuggestionBarProps {
  onTagsChange: (tags: Array<string>) => void;
  onAppendContent: (block: string) => void;
  onApplyTitle: (title: string) => void;
  isTrashed: boolean;
  content: string;
  noteId: string;
}

export default function EnrichSuggestionBar({
  noteId,
  content,
  isTrashed,
  onTagsChange,
  onApplyTitle,
  onAppendContent,
}: EnrichSuggestionBarProps) {
  const [dismissedKinds, setDismissedKinds] = useState<Array<EnrichSuggestionKind>>([]);

  const enrichMutation = useGenerateNoteEnrich();
  const dismissMutation = useDismissEnrichKind();
  const patchTagsMutation = usePatchNoteTags(noteId);

  useEffect(() => {
    const handleRequest = () => {
      if (isTrashed) return;
      if (!content.trim()) {
        toast.error(m.notes_page_toast_content_required());
        return;
      }
      setDismissedKinds([]);
      enrichMutation.mutate({ body: { content, noteId } });
    };

    window.addEventListener(NOTE_ENRICH_REQUEST_EVENT, handleRequest);
    return () => {
      window.removeEventListener(NOTE_ENRICH_REQUEST_EVENT, handleRequest);
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- re-subscribe when the request inputs change so the handler always enriches current content
  }, [content, isTrashed, noteId]);

  const dismissKind = useCallback(
    (kind: EnrichSuggestionKind) => {
      setDismissedKinds((prev) => (prev.includes(kind) ? prev : [...prev, kind]));
      dismissMutation.mutate({ body: { noteId, kind } });
    },
    [dismissMutation, noteId],
  );

  const suggestions = enrichMutation.data?.suggestions;
  const isPending = enrichMutation.isPending;

  const visibleKinds = (['title', 'summary', 'tags', 'todos'] as const).filter(
    (kind) => !dismissedKinds.includes(kind),
  );
  const visibleSuggestions =
    suggestions === undefined
      ? undefined
      : {
          title: visibleKinds.includes('title') ? suggestions.title : undefined,
          summary: visibleKinds.includes('summary') ? suggestions.summary : undefined,
          tags: visibleKinds.includes('tags') ? suggestions.tags : [],
          todos: visibleKinds.includes('todos') ? suggestions.todos : [],
        };
  const hasVisible =
    visibleSuggestions !== undefined &&
    (visibleSuggestions.title !== undefined ||
      visibleSuggestions.summary !== undefined ||
      visibleSuggestions.tags.length > 0 ||
      visibleSuggestions.todos.length > 0);

  if (!isPending && !hasVisible) return null;

  const applyTags = (tags: Array<string>) => {
    patchTagsMutation.mutate(tags, {
      onSuccess: (updated) => {
        onTagsChange(updated.tags ?? []);
        dismissKind('tags');
      },
    });
  };

  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      {isPending && (
        <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
          <Shimmer>{m.notes_enrich_loading()}</Shimmer>
        </div>
      )}

      {visibleSuggestions?.title !== undefined && (
        <EnrichSuggestionRow
          label={m.notes_enrich_title()}
          onApply={() => {
            if (visibleSuggestions.title !== undefined) {
              onApplyTitle(visibleSuggestions.title);
            }
            dismissKind('title');
          }}
          onDismiss={() => dismissKind('title')}
        >
          {visibleSuggestions.title}
        </EnrichSuggestionRow>
      )}

      {visibleSuggestions?.summary !== undefined && (
        <EnrichSuggestionRow
          label={m.notes_enrich_summary()}
          onApply={() => {
            if (visibleSuggestions.summary !== undefined) {
              onAppendContent(`> ${visibleSuggestions.summary}`);
            }
            dismissKind('summary');
          }}
          onDismiss={() => dismissKind('summary')}
        >
          {visibleSuggestions.summary}
        </EnrichSuggestionRow>
      )}

      {visibleSuggestions !== undefined && visibleSuggestions.tags.length > 0 && (
        <EnrichSuggestionRow
          label={m.notes_enrich_tags()}
          onApply={() => applyTags(visibleSuggestions.tags)}
          onDismiss={() => dismissKind('tags')}
          isApplying={patchTagsMutation.isPending}
        >
          <span className="flex flex-wrap gap-1.5">
            {visibleSuggestions.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                #{tag}
              </Badge>
            ))}
          </span>
        </EnrichSuggestionRow>
      )}

      {visibleSuggestions !== undefined && visibleSuggestions.todos.length > 0 && (
        <EnrichSuggestionRow
          label={m.notes_enrich_todos()}
          onApply={() => {
            const block = visibleSuggestions.todos
              .map((todo) => `- [ ] ${todo.text}${todo.due ? ` (due ${todo.due})` : ''}`)
              .join('\n');
            onAppendContent(block);
            dismissKind('todos');
          }}
          onDismiss={() => dismissKind('todos')}
        >
          <span className="flex flex-col gap-1">
            {visibleSuggestions.todos.map((todo) => (
              <span key={todo.text}>
                - [ ] {todo.text}
                {todo.due ? ` (due ${todo.due})` : ''}
              </span>
            ))}
          </span>
        </EnrichSuggestionRow>
      )}
    </div>
  );
}
