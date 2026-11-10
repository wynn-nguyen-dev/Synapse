# Synapse Demo Loop — Scope, Decisions, and Architecture Deltas

Status: the loop is built (`plans/001` DONE, 2026-09-21). This file records
what the demo proves, what was deliberately cut, and why — so future agents
do not re-litigate settled scope. `feature_list.json` remains the feature
state tracker; `progress.md` holds per-session evidence.

## The loop the demo proves

Capture fast → AI organizes → semantic re-find → note becomes action:

1. **Quick capture** (dialog only) creates a note, title auto-generated.
2. **Enrich** (`Ctrl+Space`) suggests title, summary, tags, todos as
   confirm-first chips; dismiss persists server-side.
3. **Ask-notes** (`/ask` palette or empty-state button) finds notes by
   meaning, with citations that jump to the note.
4. **Related notes**, **wikilinks** (`[[Title]]` + backlinks), **manual
   reorder**, and **attachments** (including paste-long-text as files)
   round out the knowledge workflow.

## Scope decisions (2026-09-21, all user-confirmed)

| Question                         | Decision                                                                                         | Why                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Demo scope: 6 candidate features | Minimal loop first: quick-capture, enrich, ask-notes, related-notes                              | Proves the loop; markdown import + BYO key deferred                                 |
| BYO Gemini key                   | Deferred; demo runs on server keys                                                               | Multi-key router with failover already merged (`ff4342c`)                           |
| Ask-notes UI                     | Palette `/ask` + dialog, click jumps to note                                                     | Smallest surface that demos citations                                               |
| Enrich dismiss persistence       | Server-side (`enrich_dismissals` table)                                                          | Survives browsers; filters re-enrich                                                |
| Create page vs dialog            | Dialog only; `/notes/create` deleted                                                             | One way to create; title auto-generates                                             |
| View/edit surface                | Page (`/notes/$noteId`), not a sheet                                                             | Deep links (ask/related/wikilinks depend on them), mobile-safe, no Escape data-loss |
| Attachments storage              | Base64 TEXT in Postgres (`note_attachments`)                                                     | Matches the text-only server; no S3 for demo                                        |
| Tags                             | Real stored column (ElementCollection), auto-classified by enrich, badges + input on detail page | `note.tags` was an unpopulated ghost field; content-hashtag hack rejected           |
| Paste-long-text                  | Converts to file in chat prompt + capture dialog; Lexical editor untouched                       | User-scoped explicitly to prompt inputs                                             |
| Bulk actions                     | Dice `ActionBar` primitives, styling preserved                                                   | Floating bar + arrow-key nav; `SelectionToolbar` deleted                            |
| Manual order                     | Integer `sortOrder`, active view only                                                            | Single ordering domain; Lexorank rejected (no cross-page/1000-note need)            |
| Linked notes                     | Minimal `[[wikilinks]]` + backlinks                                                              | Semantic related-notes already cover discovery; explicit links are cheap            |
| Enrich trigger                   | `Ctrl+Space`, no buttons                                                                         | Registry-remappable, IME-safe                                                       |
| Dirty forms                      | Confirm before losing content (dialog outside-click, note back-nav)                              | Uses existing `useConfirm`                                                          |
| Update success                   | Reset form from server response                                                                  | Kills stale-edits-after-save                                                        |
| Empty chat                       | Static cached greeting, zero model calls                                                         | Server-written greetings cost per open and pollute history                          |

## Deferred (do not build without explicit user scope)

Markdown import (+zip), BYO Gemini key, feat-023 (tab completion),
feat-024 (voice), feat-027 (PDF), feat-035 (chat-with-note), tag-filter
sidebar, cross-page reorder, per-view manual orders, Lexorank, binary/blob
storage.

## Architecture deltas

**Client routes:** `/notes/create` deleted (only create path is the
quick-capture dialog). View/edit stays on `/notes/$noteId`.

**Notes service** (`ddl-auto: update`, no migration files): `Note` gains
`tags`, `sortOrder`, `attachments`; new `NoteAttachment` entity;
`PATCH /reorder`, `GET /{id}/backlinks`, attachment CRUD,
`tags` on PATCH; default sort `pinned,desc sortOrder,asc updatedAt,desc`.

**AI service:** `POST /generator/note-enrich` + `POST
/generator/enrich-dismissal` (+ `enrich_dismissals` table, migration
`0002`); `/search/ask-notes` + `/search/related` (new `search/` module);
mirror `notes` gains `tags text[]` + `attachment_hash` (migration `0001`);
embed text = title + content + tags + attachments with change detection.
Router (`providers/router.ts`) verified, 2 tests pass.

**Client components:** quick-capture dialog/form, enrich bar/row, tag
editor, ask dialog, related panel, backlinks section, wikilink remark
plugin, Dice ActionBar bulk bar, Sortable notes list.

## Verification map

- Client: `bun --bun install` + `typecheck` + `lint` (exit 0; no bash —
  `init.sh` needs Git Bash which this environment lacks).
- AI service: `bun --bun typecheck`, `lint`, `bun test
src/providers/router.test.ts` (2 pass).
- Notes service: `gradlew.bat compileJava spotlessCheck` (test compile
  and DB tests are operator steps).
- i18n: every key in `messages/en.json` AND `messages/vi.json`, then
  `bun --bun gen:paraglide`; literal `m.*()` calls only.
- Manual smokes per phase are listed in `progress.md` (all pending —
  no browser is available to agents here).

## Known edges (by design, not bugs)

- Cross-group (pinned) drags snap back to pinned-first on refetch;
  reorder is page-local; explicit sorts omit `sortOrder`.
- Wikilinks resolve to the first FTS title match.
- Enrich dismissals are per suggestion _kind_, not value.
- Attachments: max 10/note, 200 KB each; paste threshold 1500 chars.
- Reorder/attach/tag PATCH paths assume the operator ran `db:migrate`
  (AI service) and booted with real keys in
  `AI_GOOGLE_GENERATIVE_AI_API_KEYS` (secret — never recorded).
