import type { KeyboardEvent } from 'react';

import { useState } from 'react';

import { m } from '@/paraglide/messages';

import { BadgeOverflow } from '@/components/ui/badge-overflow';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

import { XIcon } from 'lucide-react';

import { usePatchNoteTags } from '@/features/notes/hooks/api';

interface NoteTagEditorProps {
  onTagsChange: (tags: Array<string>) => void;
  tags: Array<string>;
  noteId: string;
}

export default function NoteTagEditor({ noteId, tags, onTagsChange }: NoteTagEditorProps) {
  const [draft, setDraft] = useState('');
  const patchTagsMutation = usePatchNoteTags(noteId);

  const saveTags = (next: Array<string>) => {
    patchTagsMutation.mutate(next, {
      onSuccess: (updated) => {
        onTagsChange(updated.tags ?? []);
      },
    });
  };

  const commitDraft = () => {
    const value = draft.trim().replace(/,+$/, '').trim();
    if (!value || tags.includes(value)) {
      setDraft('');
      return;
    }
    setDraft('');
    saveTags([...tags, value]);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commitDraft();
    }
  };

  const removeTag = (tag: string) => {
    saveTags(tags.filter((t) => t !== tag));
  };

  return (
    <div className="flex flex-col gap-2">
      {tags.length > 0 && (
        <BadgeOverflow
          items={tags}
          renderBadge={(tag) => (
            <Badge variant="secondary" className="gap-1 pr-1">
              #{tag}
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => removeTag(tag)}
                disabled={patchTagsMutation.isPending}
                aria-label={m.notes_enrich_tag_remove({ tag })}
                className="size-4 rounded-full"
              >
                <XIcon />
              </Button>
            </Badge>
          )}
          renderOverflow={(count) => <Badge variant="outline">+{count}</Badge>}
        />
      )}

      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleInputKeyDown}
        onBlur={commitDraft}
        placeholder={m.notes_enrich_tags_placeholder()}
        disabled={patchTagsMutation.isPending}
        className="h-8 max-w-70 text-xs"
        aria-label={m.notes_enrich_tags()}
      />
    </div>
  );
}
