import { useCallback, useState } from 'react';

export function useNoteTags(noteId: string, initialTags: Array<string>) {
  const [tagState, setTagState] = useState({ id: noteId, tags: initialTags });

  const tags = tagState.id === noteId ? tagState.tags : initialTags;

  const setTags = useCallback(
    (next: Array<string>) => {
      setTagState({ id: noteId, tags: next });
    },
    [noteId],
  );

  return {
    state: {
      tags,
    },
    actions: {
      setTags,
    },
  };
}
