# Task Conversations — Build Log

> **2026-04-17 status: v1 shipped. v2 (integration) not started.**
>
> Source of truth for intent: `data/TASK_CONVERSATIONS_PRD.md` (revised).

---

## What's actually wrong with v1

The v1 build delivered a beautiful UI but routed it through a **parallel storage + runner** that bypassed everything mature about Cabinet's existing conversation system. Concrete gaps:

1. **`.agents/.tasks/` is a fork of `.agents/.conversations/`.** Tasks created via the new system are invisible to Agents workspace, jobs, heartbeats, calendar.
2. **`task-runner` skips all prompt scaffolding.**
   - No `buildAgentContextHeader` (persona)
   - No `buildKnowledgeBaseScopeInstructions` (KB cwd scope)
   - No `buildDiagramOutputInstructions`
   - No `buildCabinetEpilogueInstructions` (`SUMMARY` / `CONTEXT` / `ARTIFACT` trailer)
   - No `buildMentionContext` (`@PageName` injection)
3. **Agent cwd is wrong.** Runner uses `DATA_DIR`; should be cabinet-scoped. "Create a poem and place in @Harry Potter Poems" cannot work.
4. **Artifacts are modeled after Claude tool calls** (file-edit +/−, command exit, tool-call), not what Cabinet means by artifact (a KB page the agent wrote).
5. **No persona awareness.** `agentSlug` is recorded but unused.
6. **Duplicate UI.** `/agents/conversations/[id]` transcript page, `/tasks/[id]` new chat page, Agents workspace live/result views — three surfaces for one concept.

Reference: the existing system's shape — `data/.agents/.conversations/{id}/meta.json` holds `agentSlug`, `cabinetPath`, `providerId`, `adapterType`, `adapterConfig`, `summary`, `contextSummary`, `artifactPaths[]`, `mentionedPaths[]`. The `artifactPaths` in real conversations point to KB pages like `marketing/blog/harry-potter-poems/index.md`. That's the ground truth we threw away.

---

## v1 inventory (what exists today, pre-integration)

### Kept as-is (UX value, no architectural debt)
- `TaskConversationPage` — full-page chat layout
- `TurnBlock` — single turn rendering
- `TaskComposerPanel` — sticky + auto-growing textarea
- `Markdown` renderer (uses existing `markdownToHtml`)
- `WrapUpCard` — context-aware end-of-task prompt
- Token bar + 80/95% thresholds
- `task-heuristics.ts` — `looksLikeAwaitingInput`, `deriveSummary`
- Sidebar `RecentTasks` (behavior correct; needs source change)
- Hash routing `#/ops/tasks/{id}` + in-shell opening

### Keep the code, rewire the data source
- `/tasks` index page — switch from `/api/tasks` → `/api/agents/conversations`
- `/tasks/new` — POST to conversations endpoint instead
- `RecentTasks` sidebar — same source swap

### To delete (or demote to shim)
- `src/lib/agents/task-store.ts` — parallel storage; port to `conversation-store`
- `src/lib/agents/task-runner.ts` — bypasses persona + epilogue; merge into `conversation-runner`
- `src/app/api/tasks/**/*.ts` — four routes; reroute to `/api/agents/conversations/*`
- `src/types/tasks.ts` — extend existing `ConversationMeta` instead
- `.agents/.tasks/` directories on disk — one-time migrate + remove

### To rewrite
- `ArtifactsList` — from Claude tool-call boxes to KB-page links with type icons
- Artifact types in `TurnArtifact` — collapse to a single `KbArtifact` (path + title + page type)

---

## v2 plan (integration-first)

See `data/TASK_CONVERSATIONS_PRD.md` for the full PRD. Summary of phases:

- [ ] **Phase 1: Extend `ConversationMeta` + `conversation-store`**
  - Add fields: `turnCount`, `lastActivityAt`, `tokens`, `runtime`, `doneAt`, `archivedAt`, `awaitingInput`, `titlePinned`, `summaryEditedAt`
  - Add `turns/NNN-{user,agent}.md` file layout alongside existing `prompt.md` + `transcript.txt`
  - Add `session.json`, `events.log` on existing conversation dirs
  - Reader composes turn list as `[turn-1-from-prompt+transcript, ...turn-files]`
  - Keep backward compat: single-shot convos still read correctly (they just report `turnCount=1`)

- [ ] **Phase 2: `continueConversationRun` in `conversation-runner.ts`**
  - Reuse `buildCabinetEpilogueInstructions`, `buildMentionContext`, `buildAgentContextHeader`
  - When adapter supports resume + session alive: send trimmed prompt with just epilogue + new mentions + user follow-up
  - Fallback (replay): full prompt with `PRIOR CONVERSATION:` block + new request
  - Persist session handle on each turn

- [ ] **Phase 3: Endpoints + SSE**
  - `POST /api/agents/conversations/[id]/continue` (new user turn)
  - `GET /api/agents/conversations/[id]/events` (SSE stream)
  - `PATCH /api/agents/conversations/[id]` — extend for `summary`, `doneAt`, `archivedAt`, `titlePinned`
  - `GET /api/agents/conversations/[id]` — include `turns[]` in response

- [ ] **Phase 4: Rewire UI**
  - `TaskConversationPage` consumes `ConversationDetail + turns[]`
  - `TaskList` (`/tasks` index) → `listConversationMetas`
  - `RecentTasks` (sidebar) → same
  - `/tasks/new` → POST `/api/agents/conversations`

- [ ] **Phase 5: Artifact row rewrite**
  - Display `meta.artifactPaths` as KB page cards with page-type icon + title (from frontmatter)
  - Drop command / tool-call / file-edit rows
  - Link rows to open the page in the editor or cabinet view

- [ ] **Phase 6: Migrate + retire v1 plumbing**
  - One-time migrator: any `.agents/.tasks/{id}/` → `.agents/.conversations/{id}/` with synthesized meta
  - Delete `task-store.ts`, `task-runner.ts`, `src/app/api/tasks/**`, `src/types/tasks.ts`
  - `/tasks/*` URL routes keep working (render via `TaskConversationPage` fed by conversations)
  - Delete `.agents/.tasks/` directory on disk after confirming migration

- [ ] **Phase 7 (optional): Agents workspace convergence**
  - Live + result views in `components/agents/*` link to `/#/ops/tasks/{id}`
  - Demote `/agents/conversations/[id]` transcript page to a debug expander

---

## Prompts we must preserve (and reuse)

From `src/lib/agents/conversation-runner.ts`:

| Function | Purpose | Must reuse in v2 |
|---|---|---|
| `buildCabinetEpilogueInstructions` | Instructs agent to end with `SUMMARY:` / `CONTEXT:` / `ARTIFACT:` cabinet block | **Yes** — both first turn and follow-ups |
| `buildAgentContextHeader(persona, slug)` | Persona context | Yes — first turn and replay-mode follow-ups |
| `buildKnowledgeBaseScopeInstructions(baseCwd, cabinetPath)` | "Work inside cabinet rooted at …" | Yes — first turn and replay |
| `buildDiagramOutputInstructions` | Mermaid edge-label rules | Yes |
| `buildMentionContext(paths)` | `@PageName` inline | Yes on every turn that has new mentions |
| `parseCabinetBlock(transcript, prompt)` | Extracts SUMMARY / CONTEXT / ARTIFACT | Run on every agent turn finalization |

---

## Shipped UX that stays (DO NOT rebuild)

- Full-page task view layout + header (title, status badge, runtime label, token bar, action buttons)
- Summary edit-in-place
- Tabs (Chat / Artifacts / Diff / Logs)
- Turn list with avatar, role, time, token count
- Inline artifacts panel per agent turn
- Wrap-up card after settled agent turn when status = idle
- Awaiting-input composer state (amber tint, auto-focus, pulse)
- Auto-growing composer (1 row → 240 px)
- Markdown rendering with code fences, lists, headings, blockquotes
- Sidebar "Recent tasks" with status dots
- Hash route `#/ops/tasks/{id}` opens in shell with sidebar visible

---

## Tests — v1

- `task-store.test.ts` — 11 passing (will be retired after phase 6)
- `task-runner.test.ts` — 7 passing (will be retired after phase 6)
- `task-heuristics.test.ts` — 9 passing (**keep; reused by v2**)
- `claude-local.test.ts` — 1 passing (unchanged; resume wiring already works)

Total: **28 passing**. v2 phases will migrate the store + runner tests to `conversation-store` + `conversation-runner` suites.

---

## Next action

**Start phase 1** — extend `ConversationMeta` and `conversation-store` to support multi-turn without breaking any existing single-shot reads. This is the foundation; nothing else lands until it's solid.

Order of work inside phase 1:
1. Add optional fields to `ConversationMeta` type.
2. Add turns reader that composes `prompt.md` + `transcript.txt` as turn 1 + reads `turns/NNN-*.md`.
3. Add `appendTurnToConversation` writer.
4. Add `session.json` + `events.log` helpers.
5. Backward-compat tests: every existing conversation still reads as a valid 1-turn task.
