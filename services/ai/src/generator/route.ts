import type { EnrichSuggestionKind, NoteEnrichOutput } from '@/generator/schemas';

import { Hono } from 'hono';

import { authJwksMiddleware } from '@/middleware/auth';
import { zValidator } from '@/middleware/validation';
import { ok } from '@/middleware/responses';

import {
  dismissEnrichKind,
  generateNoteEnrich,
  generateNoteTitle,
  getDismissedEnrichKinds,
} from '@/generator/services';
import {
  enrichDismissalRequestSchema,
  enrichNoteRequestSchema,
  generateTitleRequestSchema,
} from '@/generator/schemas';

const generatorRoute = new Hono()
  .basePath('/generator')
  .use(authJwksMiddleware)
  .post('/note-title', zValidator('json', generateTitleRequestSchema), async (c) => {
    const { content } = c.req.valid('json');

    const title = await generateNoteTitle(content);

    return ok(c, { title });
  })
  .post('/note-enrich', zValidator('json', enrichNoteRequestSchema), async (c) => {
    const userId = c.get('userId');
    const { content, noteId } = c.req.valid('json');

    const dismissed = noteId ? await getDismissedEnrichKinds(userId, noteId) : [];
    const suggestions = await generateNoteEnrich(content);

    return ok(c, { suggestions: filterDismissedKinds(suggestions, dismissed) });
  })
  .post('/enrich-dismissal', zValidator('json', enrichDismissalRequestSchema), async (c) => {
    const userId = c.get('userId');
    const { noteId, kind } = c.req.valid('json');

    await dismissEnrichKind(userId, noteId, kind);

    return ok(c, { dismissed: true });
  });

function filterDismissedKinds(
  suggestions: NoteEnrichOutput,
  dismissed: Array<EnrichSuggestionKind>,
): NoteEnrichOutput {
  const dismissedSet = new Set<string>(dismissed);

  return {
    title: dismissedSet.has('title') ? undefined : suggestions.title,
    summary: dismissedSet.has('summary') ? undefined : suggestions.summary,
    tags: dismissedSet.has('tags') ? [] : suggestions.tags,
    todos: dismissedSet.has('todos') ? [] : suggestions.todos,
  };
}

export default generatorRoute;
