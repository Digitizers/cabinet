# Changelog

All notable changes to Cabinet.

**Legend:** 🟢 New · 🔵 Improved · 🟡 Fixed · 🔴 Removed/Breaking · 🟣 AI & Skills

---

## v0.4.3 — 2026-04-30

First fully working DMG since v0.3.4.

- 🟡 Hardened-runtime entitlements let the daemon load `better-sqlite3` and `node-pty` native modules in signed builds
- 🔵 Website "Download for Mac" links direct to the v0.4.3 DMG (was a waitlist modal)

---

## v0.4.2 — 2026-04-30

- 🟡 Daemon no longer crashes on Electron startup (`createRequire(undefined)` polyfill in esbuild bundle)
- 🟢 Settings → About → "Uninstall Cabinet" (macOS)

---

## v0.4.1 — 2026-04-30

- 🟢 `AgentPicker` dropdown in the home composer with an "Auto" sentinel
- 🔵 Every agent dispatches by default; home shows all 9 quick-action chips
- 🟡 `/api/cabinets/overview` 404 silenced; onboarding font fallback restored

---

## v0.4.0 — 2026-04-30

The biggest release yet — 433 commits since v0.3.4.

- 🟣 **Skills system** — installable agent skills (Anthropic format), tiered trust, `~/.cabinet/skills/`, registry page with live manifests
- 🟣 **Multi-provider runtime (BYOAI)** — 8 CLI providers (Claude, Codex, Gemini, OpenCode, Pi, +3) with shared runtime picker, effort sliders, dynamic `listModels()`, brand icons
- 🟢 **Terminal mode** — persistent shell panel, PTY adapters for all providers, fullscreen Terminal/Details toggle, session resume via stdin injection
- 🟢 **Tasks Board v2** — drag-and-drop with undo, multi-select + bulk delete, density toggle, lane collapse, agent/depth/trigger filters, within-lane reorder, activity feed, awaiting-input markers
- 🟢 **World-class search palette** — `Cmd+K` / `/` opens a 2-pane palette backed by a daemon-side FlexSearch index with live re-indexing
- 🟢 **Onboarding rebuilt** — 3-slide animated tour, blueprint home, staged data reveal, breadcrumb, no flicker
- 🟢 **Help section** — replaces the Tour chip; deep-dive cards per feature, Skills + API Keys demos, keyboard shortcuts
- 🟢 **Agent page v2** — chat-first, color-wash hero, conversations rail, editable identity, 100 famous-figure avatars, sub-task delegation
- 🟢 **Composer & scheduling** — unified Task/Routine/Heartbeat dialog, `WhenChip` with NL parsing, shared `AgentPicker`, drag-paste-pick attachments
- 🟢 **Sidebar redesign** — Cabinet drawer with Data/Agents/Tasks tabs, drag-reorder, OS file import, Recent Tasks list
- 🟢 **Editor upgrades** — text color/highlight, embeds, drag handles, `@` mention picker, inline Lucide icons, heading anchors, folder index toggle
- 🟢 **Notebook viewer** — renders `.ipynb` cells, outputs, and visualizations
- 🟢 **Themes** — Windows 95, Windows XP, Matrix, Apple
- 🟢 **Telemetry & privacy** — anonymous opt-out telemetry, Privacy toggle, `TELEMETRY.md`
- 🟢 **Calm legal/disclaimer flow** — full-screen card, server-side acceptance, ToS + Privacy links
- 🔵 **Cabinet-scoped URLs** — unified hash scheme; legacy paths auto-redirect; sync hidden for non-git cabinets
- 🔵 **Calendar** — off-window event chevrons, editable hours, density slider, deduped multi-cabinet cron events
- 🔵 **Conversations** — multi-turn runs, live chat stream, per-turn runtime + tokens, cold-paint dedup
- 🔵 **Performance** — server FS walk cache, section chunk splitting, cold-paint from localStorage, telemetry off in dev
- 🔵 **Accessibility** — P1/P2 audit pass, focus ring, aria-labels, AT-friendly task card report
- 🔵 **MIT licensed** — `LICENSE` added; `package.json` updated
- 🟡 50+ UX polish fixes from the pre-release audit (avatar tints, breadcrumb, CTA dedup, keyboard shortcuts, `console.log` strip, etc.)

---

## v0.3.4 — 2026-04-15

- 🟡 Last working DMG of the v0.3 line — packaging and runtime stability fixes

---

## v0.3.3 — 2026-04-14

- 🟡 `cabinetai` CLI type errors

---

## v0.3.2 — 2026-04-14

- 🟢 Seed `getting-started` content in newly created cabinets
- 🟡 Tasks no longer stuck on "running" after Claude CLI finishes
- 🔵 CLI uses `npx` prefix consistently in user-facing messages and docs

---

## v0.3.1 — 2026-04-14

- 🟢 `cabinetai uninstall` command (default removes cached app; `--all` removes `~/.cabinet`)
- 🔵 Unified `cabinetai-plan.md` + `CABINETAI_DEPLOYMENT.md` into a single `CABINETAI.md`
- 🔵 Synced `app`, `create-cabinet`, and `cabinetai` packages to 0.3.1

---

## v0.3.0 — 2026-04-13

- 🟢 New `cabinetai` CLI — primary runtime: `create`, `run`, `doctor`, `update`, `import`, `list`
- 🔵 App installs to `~/.cabinet/app/v{version}/`; cabinets are lightweight data dirs anywhere
- 🔵 `create-cabinet` refactored into a thin wrapper around `cabinetai`

---

## v0.2.7 → v0.2.12 — 2026-04-09 to 2026-04-10

- 🟡 npm OIDC trusted publishing fixes (token placeholder, auth flow)
- 🟡 Stale `cabinet-release.json` no longer triggers a false "Update available" prompt
- 🔵 `About` section moved to its own Settings tab with the correct version

---

## v0.2.4 — 2026-04-08

- 🟡 Seed content no longer missing on fresh install

---

## v0.2.1 → v0.2.3 — 2026-04-07 to 2026-04-08

- 🟢 First Electron DMG releases
- 🔵 App icon, bundled seed content, packaging fixes
- 🟡 Claude CLI discovery in packaged app (NVM bin paths)
