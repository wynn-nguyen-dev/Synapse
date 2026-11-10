# Plan 001: Ship the Synapse demo loop (quick-capture → enrich → ask-notes → related)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat c30acf0..HEAD -- client/src services/ai/src services/notes/src`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `c30acf0`, 2026-09-21

## Why this matters

The demo must prove one loop: capture fast → AI organizes → semantic
re-find → note becomes action. Today capture is a full page, organization is
title-only, re-find is keyword-only, and there is no related-notes,
wikilink, attachment, or reorder story. This plan builds exactly that loop
plus the small hardening around it (dirty guards, update refresh, chat
greeting), and explicitly defers everything else (markdown import, BYO key,
feat-023/024/027/035). When it lands, the demo script runs end to end on
server-side Gemini keys with multi-key failover already merged (`ff4342c`).

## Current state

Facts the executor needs, inlined. Paths are repo-root-relative; the three
codebases are `client/` (React 19 + Vite 8 + Bun), `services/ai/`
(Bun + Hono), `services/notes/` (Spring Boot + JPA).

**Track A (key router) — already implemented, verify only:**

- `services/ai/src/providers/router.ts` — matrix router: per-task chains
  (`chat|title|embed`), per-(key,model) `bannedUntil` cooldown map,
  round-robin, all-banned de-bans the earliest-expiring pair.
  `pick(task)` returns `{ provider, modelId, reportRateLimit }`.
- `services/ai/src/providers/router.test.ts` — 2 tests, sets
  `GOOGLE_GENERATIVE_AI_API_KEYS='fake-key'` in `beforeAll`. Both pass.
- `services/ai/src/providers/ai-studio.ts` — thin
  `getChatModel()/getTitleModel()/getEmbeddingModel()` over `pick()`.
- `services/ai/src/config/env.ts` — requires `GOOGLE_GENERATIVE_AI_API_KEYS`
  (comma-split, min 1), optional `GOOGLE_GENERATIVE_AI_COOLDOWN_MS`
  (default 60000).
- `services/ai/package.json` — `@ai-sdk/google-vertex` already removed
  (only `@ai-sdk/google`); `.env.example` and
  `.github/workflows/deploy-showcase.yaml` already carry the new secret.
- Gap: `services/ai/src/generator/services.ts` `generateNoteTitle`
  swallows 429/403 into `'Untitled'` without calling `reportRateLimit()`
  (contrast `services/ai/src/lib/ai.ts` `embedText`, which does report).

**Notes service (Spring) — ground truth:**

- `services/notes/.../note/model/Note.java` — fields: id, userId,
  title (max 200), content (max 1500, TEXT), pinned/favorite/archived/
  trashed booleans, trashedAt, createdAt, updatedAt. **No `tags` column.**
- `services/notes/.../note/service/NoteService.java` — `getNotes`
  (paged), `createNote` (blank title → `titleClient.initialTitle`),
  `updateNote(title, content)`, `patchNote` (status/pinned/favorite only),
  `executeBulkAction` (ARCHIVE…DELETE_PERMANENT via `ids` list — the
  batch pattern to copy for reorder).
- `services/notes/.../note/dto/request/NoteQueryParams.java` — default
  sort is already `["pinned,desc", "updatedAt,desc"]`; `q` is a
  title/content search string; 1-indexed page/pageSize.
- `PatchNoteRequest(Boolean pinned, Boolean favorite, NoteStatus status)` —
  must gain `tags`. `NoteResponse.from(...)` must gain new fields.
- No upload/attachment endpoint exists anywhere; no `note_attachments`
  table.

**Client — ground truth:**

- `client/src/routes/_app/notes/create.tsx` — full create page (title
  optional, content required min 10 via `noteCreateFormSchema`). **Delete
  it in Phase 1.** Its triggers: palette `/create` command
  (`client/src/features/command-palette/`) and `go-to-create-note`
  (`['c','mod+n']`) in `client/src/config/keyboard-shortcuts.ts`.
- `client/src/store/note-create-prefill-store.ts` — one-shot prefill
  store (palette + chat seed it). Keep; it will seed the dialog.
- `client/src/routes/_app/notes/$noteId.tsx` — ~50-line thin route
  rendering `note-detail-page.tsx`.
- `client/src/features/notes/components/note-detail-page.tsx` — detail
  layout; enrich chips, related links, backlinks, tag badges all mount
  here (right-sidebar split zone).
- `client/src/features/notes/hooks/use-note-details.ts` /
  `use-note-create.ts` — RHF+zod forms; save via shared
  `use-form-save-shortcut.ts` (dirty-gated); `enabled: isDirty`.
- `client/src/features/notes/api/notes.http.ts` — standalone `*Client`
  fns (`createNoteClient`, `getNoteClient`, `generateNoteTitleClient`);
  `notes.api.ts` holds `noteKeys` + queryOptions. Add enrich/ask/
  related/attachment/reorder/backlinks clients here.
- `client/src/features/notes/constants.ts` — `NOTE_CONTENT_MAX_LENGTH
  = 1500`; `NOTE_SORT_OPTIONS` (query-param sorts, validated by zod).
- `client/src/features/notes/types/note.ts` — `Note` has
  `tags?: Array<string>` that **nothing populates** (ghost field; becomes
  real in Phase 2).
- `client/src/features/notes/components/note-card.tsx` +
  `hooks/use-note-card.ts` — already render `note.tags` when present.
- `client/src/features/companion/components/chat-attachment.tsx`
  (`PromptInputAttachmentsDisplay`) + `client/src/store/chat-note-attachment-store.ts`
  (one-shot pending queue, `MAX_CHAT_ATTACHMENTS`) — the composer
  attachment pattern to promote to shared and reuse.
- Chat attachments today are inline `FilePart`s in the message
  (`prompt-input.tsx` maps `files`); the AI service reads them as text
  and drops them. **No persistent attachment storage exists.**
- `client/src/components/ui/action-bar.tsx` (Dice ActionBar),
  `sortable.tsx` (`@dnd-kit`), `badge-overflow.tsx` — already vendored;
  baseline typecheck/lint green after the 2026-09-21 repair (conditional
  spreads + `??` defaults, zero runtime change).
- `client/src/features/notes/components/notes-bulk-actions.tsx` —
  fixed bottom bar, majority-rule logic, toasts. Re-skin with ActionBar,
  keep styling/placement/logic.
- Companion empty state: `ConversationEmptyState` (replace with static
  greeting).
- `useConfirm()` modal exists (used in `use-note-card.ts`) — reuse for
  dirty-discard confirmations. TanStack Router `useBlocker` for the
  back-navigation guard (keeps routes thin).

**AI service — ground truth:**

- `services/ai/src/generator/` (`route.ts` basePath `/generator`, POST
  `/note-title`, `authJwksMiddleware`, zod validator, `ok(c, {title})`
  wrapper; `schemas.ts` content 1..1500; `services.ts`
  `generateNoteTitle` with 5s `AbortSignal.race` fallback; constants
  `MAX_TITLE_LENGTH=200`, output tokens 150, temperature 0.4). **Mirror
  this folder 1:1 for enrich.**
- `services/ai/src/chat/notes.ts` `searchNotes` — FTS + RRF,
  userId-scoped, already yields citation shape `note_sources`. Reuse for
  ask-notes.
- `services/ai/src/database/schema.ts` — `notes` mirror +
  `note_embeddings` (768-dim). Mirror must gain new fields; embeddings
  re-run on content/attachment change.
- Route mounts live in `services/ai/src/index.ts` (`app.ts` pattern:
  `/chat /generator /conversations /settings /pubsub /health`). New
  basePath `/search` mounts there.

**Repo conventions the executor must match (with exemplars):**

- Kebab-case files; `@/` aliases only, never relative chains
  (`docs/RULES.md`, `client/.agents/rules/forms-and-views.md`).
- No `any` / `as T` / `!` / `@ts-ignore`; `unknown` + zod; explicit
  return types; no floating promises (`void` mark fire-and-forget);
  `import type` separated (`client/.agents/rules/typescript.md`).
- Forms: shadcn `Form` + react-hook-form + zod v4
  (`import { z } from 'zod/v4'`); submit disabled unless
  `canSubmit && isDirty && !isSubmitting`; form components never own
  dialog/route visibility (parent owns open state).
- Feature hooks return `{ state, actions }`; no monolithic stores;
  mutations live with the submitting component; batch endpoints take
  `ids: string[]` (never per-item loops).
- i18n: every user string via `m.*()` with literal call sites
  (`import { m } from '@/paraglide/messages'`); key naming
  `[feature]_[component]_[element]`; add to **both**
  `client/messages/en.json` and `client/messages/vi.json`, then
  `bun --bun gen:paraglide`. No dynamic `m[key]()` — use
  switch/getter functions.
- Colors in OKLCH; lucide icons (no literal `+`); shadcn tokens.
- React Compiler lint: no components created in render (hoist or
  `useMemo`), no sync `setState` in effects (derive or seed state).
- Ponytail: reuse before writing; shortest working diff; no new
  dependencies (dnd-kit, ActionBar, Lexical, TanStack all installed).
- `client/src/components/ui/**` stays primitive-only (adaptation edits
  like the 2026-09-21 strictness repair are allowed; no business logic).
- Git: user manages git — **do NOT commit, push, or open PRs.**

## Commands you will need

| Purpose | Command (run in stated dir) | Expected on success |
|---|---|---|
| Client install | `bun --bun install` (`client/`) | exit 0 |
| Client typecheck | `bun --bun typecheck` (`client/`) | exit 0, no errors |
| Client lint | `bun --bun lint` (`client/`) | exit 0 (pre-existing warnings in `vite.config.ts` + export-order in `compose-refs.ts` are tolerated) |
| Client build | `bun --bun run build` (`client/`) | exit 0 |
| AI router tests | `bun test src/providers/router.test.ts` (`services/ai/`) | `2 pass, 0 fail` |
| AI typecheck | `bun --bun typecheck` (`services/ai/`) | exit 0 |
| Notes service build/test | Read `services/notes/AGENTS.md` or README for the exact command — **do not guess** (see STOP conditions) | per that doc |
| JSON validity | `bun -e "await Bun.file('feature_list.json').json()"` (`client/`) | parses, no throw |

Suggested executor toolkit: `i18n-paraglide` skill for any message-key
work; `tanstack-query-best-practices` for new queryOptions/mutations;
`refactor` if any touched component crosses the split triggers
(`docs/RULES.md`: 8+ props, 2+ nested ternaries, inline `.map()`
handlers, 3+ `useEffect`s, prop drilling).

## Scope

**In scope:**

- `client/src/routes/_app/notes/create.tsx` (DELETE) + its two triggers
  (palette `/create`, `go-to-create-note` binding)
- `client/src/features/notes/components/quick-capture-dialog.tsx` (NEW)
  + mount in `client/src/routes/_app/route.tsx`
- `client/src/features/notes/` (detail page, hooks, api, constants,
  schemas, list, bulk actions, tag input)
- `client/src/config/keyboard-shortcuts.ts` (new `enrich-note =
  ctrl+space` binding; retarget create binding to open the dialog)
- `client/src/components/shared/` attachment promotion target
  (promote `chat-attachment.tsx` pattern + attachment store; do NOT
  modify `components/ui/*` behavior)
- `client/src/features/companion/` (empty-state greeting only)
- `client/messages/en.json`, `client/messages/vi.json`
- `services/ai/src/generator/enrich/` (NEW: route+service+schema+
  repository, mirror of `note-title/`), `services/ai/src/search/`
  (NEW: ask-notes + related), `services/ai/src/database/schema.ts`
  (`enrich_dismissals`), `services/ai/src/index.ts` (mounts),
  `services/ai/src/generator/services.ts` (reportRateLimit gap)
- `services/notes/.../note/` (model, service, dtos, response,
  controller, repository, migration)
- `plans/README.md` (status row), `client/progress.md`,
  `client/feature_list.json`

**Out of scope (do NOT touch, even though they look related):**

- Markdown import (+zip), BYO Gemini key, feat-023 (tab completion),
  feat-024 (voice), feat-027 (PDF), feat-035 (chat-with-note) — all
  deferred, stay `not-started`.
- Tag-filter sidebar / tag pages (feat-005 stays `deprecated`); stored
  tags are display/edit only, no tag search/filter endpoints.
- S3 or any binary/blob storage — attachments are base64 TEXT in
  Postgres by decision.
- Lexorank / fractional ranks — integer `sortOrder` by decision.
- Favorites/archive/trash sort semantics — only the active (notes)
  view gets the drag UI; other views keep natural sorts.
- `client/src/paraglide/**` (generated), `components.json` theme
  tokens (unless a new token is unavoidable — then OKLCH only).
- Any commit/push/PR — user manages git.

## Git workflow

- The operator manages git. Do NOT commit, amend, push, or open PRs.
- Keep `git status` limited to in-scope files; leave the tree so
  `./init.sh`-equivalent (`install` + `typecheck` + `lint`) passes.

## Steps

### Step 1: Phase 0 — Track A finalization (verify + one gap)

1. Re-run `bun test src/providers/router.test.ts` in `services/ai/` →
   `2 pass, 0 fail`.
2. In `services/ai/src/generator/services.ts`, on rate-limit/quota
   error inside `generateNoteTitle`, call `reportRateLimit()` from the
   picked model handle before falling back to `'Untitled'` (same
   pattern as `lib/ai.ts` `embedText`). New enrich code (Phase 3) must
   do the same.
3. Record evidence in `client/progress.md` + mark the router milestone
   in `client/feature_list.json` (re-tag to `deprecated` for
   feat-005/011/014/016/018/020/021 is already done — do not redo).
   Full boot smoke with real keys is a manual operator step (keys are
   secrets — never print or commit them).

**Verify**: router tests `2 pass, 0 fail`; `bun --bun typecheck`
in `services/ai/` exit 0.

### Step 2: Phase 1 — quick-capture dialog becomes the ONLY create path

1. Create `client/src/features/notes/components/quick-capture-dialog.tsx`:
   controlled by parent (open state + `onOpenChange` props — form never
   owns the dialog), single textarea + Save (Ctrl/Cmd+Enter), values
   shaped as `NoteCreateFormValues` (content required, title optional),
   seeded from `note-create-prefill-store`. Dirty = non-empty content.
2. Mount it in `client/src/routes/_app/route.tsx` beside
   `CommandPalette`; wire the `open-quick-capture` window event.
3. Retarget: palette `/create` command and `go-to-create-note`
   (`['c','mod+n']`) fire `open-quick-capture` instead of navigating.
   On save: `createNoteClient` → navigate `/notes/$noteId`.
4. Outside-click/Escape while dirty → `preventDefault` the dismiss and
   confirm via `useConfirm()` ("unsaved content will be lost"); close
   only on confirm or explicit cancel.
5. Attachments allowed in the dialog via the shared composer (Phase 6
   component if built first; otherwise plain textarea ships first and
   attachments attach in a follow-up — order Phases 1 then 6).
6. Delete `client/src/routes/_app/notes/create.tsx`; regenerate routes;
   prune orphan create-page i18n keys from both message files.

**Verify**: `bun --bun typecheck` exit 0; `bun --bun lint` exit 0;
`grep -rn "notes/create" client/src/routes/` returns only the deleted
file's absence (no dangling imports); manual: Ctrl/Cmd+Enter saves and
navigates, outside-click-dirty confirms.

### Step 3: Phase 2 — notes-service backend (tags, sortOrder, attachments, backlinks)

1. `Note.java`: add `tags` (JSON/text converter, storage only) and
   `sortOrder` (nullable Integer) + migration.
2. List ordering: `ORDER BY pinned DESC, sortOrder ASC NULLS LAST,
   updatedAt DESC`. Expose `sortOrder,asc` in allowed sort fields.
3. `PATCH /notes/reorder { noteIds: [...] }` — assign
   `sortOrder = index` transactionally (copy the
   `executeBulkAction` ids-list pattern, single request).
4. `note_attachments` table (`id, note_id, filename,
   content_base64 TEXT`) + `POST /notes/:id/attachments`,
   `GET /notes/:id/attachments`, `DELETE /notes/attachments/:id`.
   Text-only (.md/.txt); pastes/uploads stored base64.
5. `GET /notes/:id/backlinks` — same-user notes whose content contains
   this note's title (`LIKE %title%`), exclude self + trashed, top 20.
6. `PatchNoteRequest` gains `tags`; `NoteResponse` gains
   `tags/sortOrder/attachments`.
7. AI service: extend the `notes` mirror + pubsub for new fields;
   re-embed on content/attachment change.

**Verify**: service's own build/test command (from its AGENTS.md)
green; contract check — response of GET note contains
`tags/sortOrder`; reorder returns 2xx and list order changes.

### Step 4: Phase 3 — enrich via Ctrl+Space (no buttons)

1. Backend `services/ai/src/generator/enrich/` mirroring
   `note-title/`: `schemas.ts` (`{ content: 1..1500, noteId?: uuid }`
   in, `{ title?, summary?, tags: string[], todos: [{text, due?}] }`
   out via `Output.object`); `services.ts` (`generateNoteEnrich`,
   5s race fallback, `getChatModel().model`, `reportRateLimit()` on
   429/403); `route.ts` POST `/note-enrich` → `{ suggestions }`
   minus dismissed kinds when `noteId` present, plus POST
   `/enrich-dismissal { noteId, kind }` (idempotent upsert backed by
   new `enrich_dismissals(userId, noteId, kind)` table +
   repository + migration).
2. Client: registry binding `enrich-note = ctrl+space`
   (editor-scoped Lexical keybinding; `mod+space` is free — verify no
   registry conflict at implementation time). Trigger renders the
   floating chip bar above the editor in `note-detail-page.tsx`
   (one row per kind: label + value + Apply/Dismiss; hide entirely
   for trashed notes). Apply: title → title field; summary/todos →
   insert into editor; tags → patch note tags. Dismiss → dismissal
   mutation + optimistic hide. One passive hint string in the
   empty-editor state; no buttons anywhere.
3. i18n keys EN+VI (`notes_enrich_*`), literal `m.*()` calls.

**Verify**: typecheck + lint exit 0; curl smoke against a dev AI
service: `/note-enrich` returns suggestions; dismiss then re-enrich
omits the kind; manual Ctrl+Space opens chips, Apply writes,
Dismiss hides.

### Step 5: Phase 4 — ask-notes + related-notes

1. `services/ai/src/search/` mounted as basePath `/search` in
   `index.ts`: POST `/ask-notes { query: 1..500 }` → top-5
   `{ noteId, title, snippet }` reusing `chat/notes.ts searchNotes`;
   GET `/notes/:noteId/related?limit=2` → cosine top-2 from
   `note_embeddings` (exclude self, userId-scoped; `[]` when the
   anchor has no embedding). `authJwksMiddleware` on both.
2. Client: palette `/ask` command + `ask-notes-dialog.tsx`
   (debounced results; click jumps `/notes/$noteId`); an "Ask"
   button on the notes empty state; related-links section in the
   detail sidebar (hidden when empty).
3. `askNotesClient` (+ related/backlinks clients) in
   `notes/http.ts`; i18n keys EN+VI.

**Verify**: typecheck + lint exit 0; curl smoke for both endpoints;
manual: `/ask` → results → jump lands on the note.

### Step 6: Phase 5 — minimal wikilinks + backlinks UI

1. Lexical plugin parses `[[title]]` in content → styled chip;
   click resolves via existing `GET /notes?q=<title>&pageSize=1`
   and navigates to the matched note.
2. Detail page Backlinks section from
   `GET /notes/:id/backlinks` (Phase 2).

**Verify**: typecheck + lint exit 0; manual: `[[title]]` renders,
clicks through; backlinks list the linking note.

### Step 7: Phase 6 — unified attachments + paste-long-text → file

1. Promote the companion composer pattern to shared: the pending
   attachment store + `PromptInputAttachmentsDisplay` reused in the
   quick-capture dialog and detail composer (chat path untouched).
2. Intercept paste/input exceeding `NOTE_CONTENT_MAX_LENGTH` (1500):
   head stays in content, remainder saved as a `.md` attachment
   (base64 → `POST /notes/:id/attachments`).
3. Attached text joins note content for embedding/RAG on
   create/attach.

**Verify**: typecheck + lint exit 0; manual: long paste creates an
attachment; attachment text is returned by ask-notes snippets.

### Step 8: Phase 7 — bulk actions → Dice ActionBar

Re-compose `notes-bulk-actions.tsx` with `ui/action-bar.tsx`
(Root/Group/Item/Separator), preserving fixed-bottom placement,
styling, majority-rule logic, and toasts. No behavior change.

**Verify**: typecheck + lint exit 0; manual: select → bar →
each bulk action still works with correct toasts.

### Step 9: Phase 8 — sortable reorder (active view only)

Wrap the notes-list grid in `ui/sortable.tsx` on the **active
(notes) view only**; drag → optimistic reorder → `PATCH
/notes/reorder`. Page-local; an explicit `sort=` field overrides
manual order. Favorites/archive/trash untouched.

**Verify**: typecheck + lint exit 0; manual: drag → order
persists after reload; pinned stay first.

### Step 10: Guards, refresh, greeting (approved additions)

1. `$noteId` dirty guard: TanStack `useBlocker` in the detail
   component (routes stay thin) — navigating away while dirty
   confirms via `useConfirm()`.
2. Update-success refresh: `updateNoteMutation.onSuccess` resets
   the RHF form with the **server-returned** `Note` (and invalidates
   the detail query) so `isDirty` and values stay truthful.
3. Replace `ConversationEmptyState` with a static cached greeting
   (i18n, time-of-day variant, 2–3 affordance hints). Client-side
   only — never enters history/RAG, zero model calls.

**Verify**: typecheck + lint exit 0; manual: dirty-back confirms;
post-save form is clean; empty chat shows greeting instantly.

## Test plan

- Router: existing `services/ai/src/providers/router.test.ts` (2
  tests) must keep passing — pattern for any new ai-service test.
- New tests: enrich dismissal filter (dismissed kind omitted on
  re-enrich); reorder endpoint (order persists); backlinks (linking
  note listed, self excluded). Client: no test framework is
  established in `client/` (no `*.test.*` pattern observed) — do NOT
  introduce one; verify via typecheck/lint/build + curl + manual
  smoke.
- Verification after every phase: client `typecheck` + `lint` exit
  0; ai-service `typecheck` exit 0; notes-service per its own doc.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `bun --bun typecheck` (client) exits 0
- [ ] `bun --bun lint` (client) exits 0 errors (2 pre-existing
  warnings tolerated)
- [ ] `bun test src/providers/router.test.ts` → `2 pass, 0 fail`
- [ ] `client/src/routes/_app/notes/create.tsx` deleted;
  `grep -rn "notes/create" client/src/routes/` finds no live route
- [ ] `grep -rn "-Prune check: no sparkle/enrich buttons" client/src/features/notes/` — enrich is Ctrl+Space only
- [ ] New endpoints respond: `/generator/note-enrich`,
  `/generator/enrich-dismissal`, `/search/ask-notes`,
  `/search/notes/:id/related`, `/notes/:id/backlinks`,
  `/notes/reorder`, note attachments CRUD
- [ ] No files outside the in-scope list are modified
  (`git status --short`)
- [ ] `messages/en.json` and `messages/vi.json` have identical key
  sets for every new key (parity check)
- [ ] `plans/README.md` status row for 001 updated to DONE

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the
  excerpts (codebase drifted since `c30acf0`).
- The notes-service build/test command cannot be determined from
  `services/notes/AGENTS.md` or its README.
- Any step's verification fails twice after a reasonable fix attempt.
- The fix appears to require touching an out-of-scope file
  (especially `components/ui/*` behavior, `paraglide/**`, or a new
  dependency).
- `ctrl+space` conflicts with an existing registry binding or the OS
  swallows it in the target browsers.
- The AI service embedding dimension is not 768 (related-notes cosine
  math assumes `lib/ai.ts` output).
- You are asked for, or stumble onto, real API keys/secrets — reference
  file:line and credential type only, never values.

## Maintenance notes

- If pagination/cursor changes land on the notes list, the page-local
  reorder in Phase 8 must be revisited (order windows shift).
- If tag search/filter ever returns (feat-005 is deprecated, not
  deleted-forever), the JSON/text `tags` column needs an index or a
  join table — today's storage-only shape will not serve queries.
- `enrich_dismissals` is keyed by suggestion *kind*, not value: a
  dismissed kind stays hidden even when the model would suggest a
  different value next time. If per-value dismissal is wanted later,
  add a value hash to the PK.
- Reviewer focus for the PR(s): exactOptionalPropertyTypes discipline
  in all new spreads (the 2026-09-21 Dice repair is the pattern);
  Paraglide literal call sites; no `as`/non-null assertions; batch
  endpoints keep the `ids`-list shape.
- Deferred follow-ups (not this plan): markdown import, BYO key,
  feat-023/024/027/035, cross-page reorder, per-view manual orders.
