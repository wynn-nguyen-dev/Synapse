# Implementation Plans

Generated via the improve skill on 2026-09-21. Execute in the order below
unless dependencies say otherwise. Each executor: read the plan fully
before starting, honor its STOP conditions, and update your row when done.
User manages git — never commit, push, or open PRs.

## Execution order & status

| Plan | Title | Priority | Effort | Depends on | Status |
| ---- | ----- | -------- | ------ | ---------- | ------ |
| 001  | Ship the Synapse demo loop (quick-capture → enrich → ask-notes → related) | P1 | L | — | DONE (Phases 0–10 + verification complete 2026-09-21; manual smokes pending per phase) |

Status values: TODO | IN PROGRESS | DONE | BLOCKED (with one-line reason) | REJECTED (with one-line rationale — finding fixed independently or approach abandoned)

## Dependency notes

- 001 is self-contained (phases 0–10 run in file order). Do not split
  phases into separate plans without operator approval.

## Findings considered and rejected

- Lexorank for manual note ordering: integer `sortOrder` suffices for a
  single reorderable list with page-local drags; revisit only for
  cross-page drag on 1000+ notes.
- BYO Gemini key + markdown import: deferred, demo runs on server keys.
- Server/LLM-written chat greeting: rejected, static cached greeting
  only (zero model calls, never enters history/RAG).
- Tag-filter sidebar revival: rejected, feat-005 stays deprecated;
  stored tags are display/edit only.
