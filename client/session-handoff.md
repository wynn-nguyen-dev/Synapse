# Session Handoff

## Current Objective

- **Goal:** Ship the Synapse demo loop (plan `plans/001`, phases 0–10)
- **Current status:** Complete — all phases implemented and verified
  (typecheck/lint/tests green; manual smokes pending, no browser
  available to agents). See `docs/DEMO_LOOP.md` for scope and decisions.
- **Branch / commit:** `main` at `c30acf0`; nothing committed (user
  manages git; several files staged + unstaged — leave the index alone)

## Completed This Session

- [x] **Baseline repair** — Dice UI strictness errors fixed with zero
      runtime change (`action-bar.tsx`, `sortable.tsx`, `compose-refs.ts`)
- [x] **Phase 0** — removed features re-tagged `deprecated` in
      `feature_list.json`; key router verified (2 tests pass)
- [x] **Phase 1 (feat-028)** — quick-capture dialog, only create path;
      `/notes/create` deleted
- [x] **Phase 2** — notes backend: tags, `sortOrder`, attachments,
      backlinks, reorder endpoint, list ordering
- [x] **Phase 3 (feat-065)** — enrich via Ctrl+Space + tag editor;
      `reportRateLimit` gap closed
- [x] **Phase 4 (feat-066)** — ask-notes + related-notes (+ new
      `search/` module in AI service)
- [x] **Phase 5 (feat-067)** — wikilinks + backlinks section
- [x] **Phase 6 (feat-068)** — unified attachments + paste-to-file
      (chat prompt + capture dialog; Lexical untouched)
- [x] **Phase 7 (feat-069)** — bulk actions on Dice ActionBar;
      `SelectionToolbar` deleted
- [x] **Phase 8 (feat-070)** — manual reorder via Sortable
- [x] **Docs** — `docs/DEMO_LOOP.md` (new), `plans/001` + README,
      `progress.md`, `feature_list.json` (69 features)

## Verification Evidence

| Check                         | Command                                                | Result                                   |
| ----------------------------- | ------------------------------------------------------ | ---------------------------------------- |
| Client install/typecheck/lint | `bun --bun install                                     | typecheck                                | lint` | exit 0, 0 errors/warnings |
| Client i18n parity            | key-set diff en/vi                                     | 665/665, 0 missing                       |
| AI typecheck/lint/tests       | `bun --bun typecheck\|lint`, `bun test router.test.ts` | exit 0, 2 pass                           |
| Notes compile/format          | `gradlew.bat compileJava spotlessCheck`                | green (test compile excluded per user)   |
| Drizzle migrations            | `bun run db:generate`                                  | `0001` (tags/hash) + `0002` (dismissals) |

## Files Changed (summary — see `progress.md` for detail)

- `client/src/features/notes/` — dialog, enrich, tags, ask, related,
  backlinks, reorder, attachments, hooks, api, schemas, types
- `client/src/routes/_app/` — dialog mounts; `notes/create.tsx` deleted
- `client/src/components/{shared,ui,app}` — wikilink renderer, bulk
  bar, palette/header/keybind triggers
- `client/messages/en.json` + `vi.json`, `feature_list.json`,
  `progress.md`, `plans/`, `docs/DEMO_LOOP.md`
- `services/ai/src/{generator,search,embeddings,database,app.ts}` +
  `drizzle/0001|0002`
- `services/notes/.../note/{model,repository,service,controller,dto}` +
  `common/utils/SortSupport.java`

## Decisions Made

All in `docs/DEMO_LOOP.md` — headliners: dialog-only create, page (not
sheet) for view/edit, server-side dismissals, base64 Postgres
attachments, real tags column, integer `sortOrder` (Lexorank rejected),
minimal wikilinks, Ctrl+Space enrich with no buttons, chat-only (not
Lexical) paste-to-file, static cached chat greeting.

## Blockers / Risks

- Manual smokes pending for every phase (operator with a browser).
- Operator must boot services with real keys
  (`AI_GOOGLE_GENERATIVE_AI_API_KEYS`), run AI `db:migrate`, and run
  notes `compileTestJava`/DB tests.
- `deleteExpiredTrashedNotes` (notes service) is dead code with no
  callers — needs attachment/tag cleanup if ever wired.
- Cross-group pinned drags snap back; wikilinks take first FTS match;
  enrich dismissals are per-kind (see DEMO_LOOP.md edges).

## Next Session Startup

1. Read `AGENTS.md`.
2. Read `docs/DEMO_LOOP.md` (scope + decisions).
3. Read `feature_list.json` and `progress.md`.
4. Review this handoff.
5. Run `./init.sh` before editing (Git Bash required; without it, run
   `bun --bun install` + `typecheck` + `lint` directly).

## Recommended Next Step

Work the operator checklist above (boot, migrate, manual smokes). No
open build scope remains — anything new (markdown import, BYO key,
feat-023/024/027/035) needs explicit user scope per `docs/DEMO_LOOP.md`.
