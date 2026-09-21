import { Hono } from 'hono';

import { authJwksMiddleware } from '@/middleware/auth';
import { zValidator } from '@/middleware/validation';
import { ok } from '@/middleware/responses';

import { askNotesRequestSchema, relatedNotesQuerySchema } from '@/search/schemas';
import { askNotes, relatedNotes } from '@/search/services';

const searchRoute = new Hono()
  .basePath('/search')
  .use(authJwksMiddleware)
  .post('/ask-notes', zValidator('json', askNotesRequestSchema), async (c) => {
    const userId = c.get('userId');
    const { query } = c.req.valid('json');

    return ok(c, { results: await askNotes(userId, query) });
  })
  .get('/related', zValidator('query', relatedNotesQuerySchema), async (c) => {
    const userId = c.get('userId');
    const { noteId, limit } = c.req.valid('query');

    return ok(c, { results: await relatedNotes(userId, noteId, limit) });
  });

export default searchRoute;
