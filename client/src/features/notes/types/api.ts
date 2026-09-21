import type {
  AskNoteResult,
  AskNotesInput,
  AttachmentDto,
  BulkNoteActions,
  EnrichDismissalInput,
  EnrichNoteRequestInput,
  EnrichSuggestions,
  GenerateNoteTitleInput,
  NoteIdParams,
  NoteInputPayload,
  NotesQueryParams,
  ReorderNotesInput,
} from '@/features/notes/schemas';
import type { ApiSuccessResponse, PaginatedApiSuccessResponse } from '@/types/response';
import type { Note } from '@/features/notes/types/note';
import type { EnsureRouter } from '@/lib/fetch';

export type NotesApiParams = Omit<NotesQueryParams, 'sort'> & {
  sort: Array<NotesQueryParams['sort'] | (string & {})>;
  archived?: boolean;
  favorite?: boolean;
  trashed?: boolean;
};
export type PatchNoteInput = {
  status?: 'ARCHIVED' | 'TRASHED' | 'ACTIVE';
  tags?: Array<string>;
  favorite?: boolean;
  pinned?: boolean;
};

export type NotesFetchRouter = EnsureRouter<{
  '/api/v1/notes/:id': {
    $put: {
      response: ApiSuccessResponse<Note>;
      body: NoteInputPayload;
      params: NoteIdParams;
    };
    $patch: {
      response: ApiSuccessResponse<Note>;
      body: PatchNoteInput;
      params: NoteIdParams;
    };
    $delete: {
      response: ApiSuccessResponse<Record<never, never>>;
      params: { id: string };
    };
    $get: {
      response: ApiSuccessResponse<Note>;
      params: NoteIdParams;
    };
  };
  '/api/v1/notes': {
    $get: {
      response: PaginatedApiSuccessResponse<Note>;
      query?: NotesApiParams | undefined;
    };
    $post: {
      response: ApiSuccessResponse<Note>;
      body: NoteInputPayload;
    };
  };
  '/api/v1/notes/:id/attachments': {
    $post: {
      body: { contentBase64: string; filename: string };
      response: ApiSuccessResponse<AttachmentDto>;
      params: NoteIdParams;
    };
  };
  '/api/v1/ai/search/related': {
    $get: {
      response: ApiSuccessResponse<{ results: Array<AskNoteResult> }>;
      query: { noteId: string; limit?: number };
    };
  };
  '/api/v1/ai/generator/note-enrich': {
    $post: {
      response: ApiSuccessResponse<{ suggestions: EnrichSuggestions }>;
      body: EnrichNoteRequestInput;
    };
  };
  '/api/v1/ai/generator/note-title': {
    $post: {
      response: ApiSuccessResponse<Prettify<Pick<Note, 'title'>>>;
      body: GenerateNoteTitleInput;
    };
  };
  '/api/v1/ai/generator/enrich-dismissal': {
    $post: {
      response: ApiSuccessResponse<{ dismissed: boolean }>;
      body: EnrichDismissalInput;
    };
  };
  '/api/v1/ai/search/ask-notes': {
    $post: {
      response: ApiSuccessResponse<{ results: Array<AskNoteResult> }>;
      body: AskNotesInput;
    };
  };
  '/api/v1/notes/:id/backlinks': {
    $get: {
      response: ApiSuccessResponse<Array<Note>>;
      params: NoteIdParams;
    };
  };
  '/api/v1/notes/bulk/actions': {
    $post: {
      response: ApiSuccessResponse<number>;
      body: BulkNoteActions;
    };
  };
  '/api/v1/notes/reorder': {
    $patch: {
      response: ApiSuccessResponse<number>;
      body: ReorderNotesInput;
    };
  };
  '/api/v1/notes/trash': {
    $delete: {
      response: ApiSuccessResponse<Record<never, never>>;
    };
  };
}>;
