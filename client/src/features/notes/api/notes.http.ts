import type { InferRequestType, InferResponseType } from '@/lib/fetch';

import { $fetch } from '@/lib/fetch';

export type GetNotesRequest = InferRequestType<typeof $fetch.api.v1.notes.$get>;
export type GetNotesResponse = InferResponseType<typeof $fetch.api.v1.notes.$get>['data'];

export async function getNotesClient(args: GetNotesRequest) {
  const result = await $fetch.api.v1.notes.$get(args);

  return result.data;
}

export type GetNoteRequest = InferRequestType<(typeof $fetch.api.v1.notes)[':id']['$get']>;
export type GetNoteResponse = InferResponseType<
  (typeof $fetch.api.v1.notes)[':id']['$get']
>['data'];

export async function getNoteClient(args: GetNoteRequest) {
  const result = await $fetch.api.v1.notes[':id'].$get(args);

  return result.data;
}

export type CreateNoteRequest = InferRequestType<(typeof $fetch.api.v1.notes)['$post']>;
export type CreateNoteResponse = InferResponseType<(typeof $fetch.api.v1.notes)['$post']>['data'];

export async function createNoteClient(args: CreateNoteRequest) {
  const result = await $fetch.api.v1.notes.$post(args);

  return result.data;
}

export type UpdateNoteRequest = InferRequestType<(typeof $fetch.api.v1.notes)[':id']['$put']>;
export type UpdateNoteResponse = InferResponseType<
  (typeof $fetch.api.v1.notes)[':id']['$put']
>['data'];

export async function updateNoteClient(args: UpdateNoteRequest) {
  const result = await $fetch.api.v1.notes[':id'].$put(args);

  return result.data;
}

export type PatchNoteRequest = InferRequestType<(typeof $fetch.api.v1.notes)[':id']['$patch']>;
export type PatchNoteResponse = InferResponseType<
  (typeof $fetch.api.v1.notes)[':id']['$patch']
>['data'];

export async function patchNoteClient(args: PatchNoteRequest) {
  const result = await $fetch.api.v1.notes[':id'].$patch(args);

  return result.data;
}

export type DeleteNoteRequest = InferRequestType<(typeof $fetch.api.v1.notes)[':id']['$delete']>;
export type DeleteNoteResponse = InferResponseType<
  (typeof $fetch.api.v1.notes)[':id']['$delete']
>['data'];

export async function deleteNoteClient(args: DeleteNoteRequest) {
  const result = await $fetch.api.v1.notes[':id'].$delete(args);

  return result.data;
}

export type BulkNoteActionsRequest = InferRequestType<
  typeof $fetch.api.v1.notes.bulk.actions.$post
>;
export type BulkNoteActionsResponse = InferResponseType<
  typeof $fetch.api.v1.notes.bulk.actions.$post
>['data'];

export async function bulkNoteActionsClient(args: BulkNoteActionsRequest) {
  const result = await $fetch.api.v1.notes.bulk.actions.$post(args);

  return result.data;
}

export type EmptyTrashNotesRequest = InferRequestType<typeof $fetch.api.v1.notes.trash.$delete>;
export type EmptyTrashNotesResponse = InferResponseType<
  typeof $fetch.api.v1.notes.trash.$delete
>['data'];

export async function emptyTrashNotesClient() {
  const result = await $fetch.api.v1.notes.trash.$delete();

  return result.data;
}

export type GenerateNoteTitleRequest = InferRequestType<
  (typeof $fetch.api.v1.ai.generator)['note-title']['$post']
>;
export type GenerateNoteTitleResponse = InferResponseType<
  (typeof $fetch.api.v1.ai.generator)['note-title']['$post']
>['data'];

export async function generateNoteTitleClient(args: GenerateNoteTitleRequest) {
  const result = await $fetch.api.v1.ai.generator['note-title'].$post(args);

  return result.data;
}

export type GenerateNoteEnrichRequest = InferRequestType<
  (typeof $fetch.api.v1.ai.generator)['note-enrich']['$post']
>;
export type GenerateNoteEnrichResponse = InferResponseType<
  (typeof $fetch.api.v1.ai.generator)['note-enrich']['$post']
>['data'];

export async function generateNoteEnrichClient(args: GenerateNoteEnrichRequest) {
  const result = await $fetch.api.v1.ai.generator['note-enrich'].$post(args);

  return result.data;
}

export type DismissEnrichSuggestionRequest = InferRequestType<
  (typeof $fetch.api.v1.ai.generator)['enrich-dismissal']['$post']
>;
export type DismissEnrichSuggestionResponse = InferResponseType<
  (typeof $fetch.api.v1.ai.generator)['enrich-dismissal']['$post']
>['data'];

export async function dismissEnrichSuggestionClient(args: DismissEnrichSuggestionRequest) {
  const result = await $fetch.api.v1.ai.generator['enrich-dismissal'].$post(args);

  return result.data;
}

export type AskNotesRequest = InferRequestType<
  (typeof $fetch.api.v1.ai.search)['ask-notes']['$post']
>;
export type AskNotesResponse = InferResponseType<
  (typeof $fetch.api.v1.ai.search)['ask-notes']['$post']
>['data'];

export async function askNotesClient(args: AskNotesRequest) {
  const result = await $fetch.api.v1.ai.search['ask-notes'].$post(args);

  return result.data;
}

export type RelatedNotesRequest = InferRequestType<
  (typeof $fetch.api.v1.ai.search)['related']['$get']
>;
export type RelatedNotesResponse = InferResponseType<
  (typeof $fetch.api.v1.ai.search)['related']['$get']
>['data'];

export async function relatedNotesClient(args: RelatedNotesRequest) {
  const result = await $fetch.api.v1.ai.search.related.$get(args);

  return result.data;
}

export type GetBacklinksRequest = InferRequestType<
  (typeof $fetch.api.v1.notes)[':id']['backlinks']['$get']
>;
export type GetBacklinksResponse = InferResponseType<
  (typeof $fetch.api.v1.notes)[':id']['backlinks']['$get']
>['data'];

export async function getBacklinksClient(args: GetBacklinksRequest) {
  const result = await $fetch.api.v1.notes[':id'].backlinks.$get(args);

  return result.data;
}

export type CreateAttachmentRequest = InferRequestType<
  (typeof $fetch.api.v1.notes)[':id']['attachments']['$post']
>;
export type CreateAttachmentResponse = InferResponseType<
  (typeof $fetch.api.v1.notes)[':id']['attachments']['$post']
>['data'];

export async function createAttachmentClient(args: CreateAttachmentRequest) {
  const result = await $fetch.api.v1.notes[':id'].attachments.$post(args);

  return result.data;
}

export type ReorderNotesRequest = InferRequestType<
  (typeof $fetch.api.v1.notes)['reorder']['$patch']
>;
export type ReorderNotesResponse = InferResponseType<
  (typeof $fetch.api.v1.notes)['reorder']['$patch']
>['data'];

export async function reorderNotesClient(args: ReorderNotesRequest) {
  const result = await $fetch.api.v1.notes.reorder.$patch(args);

  return result.data;
}
