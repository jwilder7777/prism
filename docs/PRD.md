# Prism — Product Requirements Document

**Version:** 0.2 (Reframed)
**Status:** Pre-Phase-1
**Owner:** Josh
**Last updated:** April 29, 2026

---

## 1. Pitch

Prism is mission control for coding agents. Run as many as you want, across as many projects as you have, with whatever editor you use. See what they're all doing at a glance. Approve their work without losing context.

## 2. The user

Josh — a senior developer who runs multiple coding agents daily, uses Zed and VS Code interchangeably, has two GitHub accounts, and is tired of jumping between terminals to know what his agents are doing. Prism is built for this user first; broader audience later. Phase 1 ships the smallest version Josh would use every day. Two weeks of daily use is the validation bar before adding anything.

## 3. What it is

A standalone desktop app that supervises coding agents. Prism does not include a code editor.

Agent diffs render natively inside the Prism window — Monaco-quality split view, accept/reject inline. When you want to actually edit a file, click "Open" and Prism launches it in your configured editor (VS Code, Zed, JetBrains, whatever you use). Editing is your editor's job. Supervision and review are Prism's.

The agent layer is broader than chat:

- **Chat (ACP).** Conversational sessions with Claude Code, Codex CLI, Gemini CLI, OpenCode, or any ACP-compliant agent.
- **Button-triggered tools.** Preconfigured one-shot agent invocations bound to UI affordances — "Generate commit message," "Review my PR," "Update CHANGELOG since last tag."
- **Event-triggered.** Agents that fire on git events (push, PR open, merge conflict) or schedules. Output goes to a notification feed; no terminal interaction needed.

## 4. The three pillars

**Mission Control.** The headline surface. A cross-project view of every running agent: status, mode, current action, cost, time, last output. Drill in to any agent's session. Approve, pause, stop, redirect from one console. Notifications when an agent stalls, errors, or asks for approval.

**Diff-first review.** Diffs are first-class in Prism, not punted to the editor. The session view shows the working set of changes the agent has proposed — split view, syntax-highlighted, accept/reject per hunk. Shep tracks diffs but doesn't render them; Prism closes that gap. "Open" launches your editor on the file when you want to make manual edits.

**Agent breadth.** Three modes — chat, button, event — sharing one Rust backend that handles process lifecycle, ACP transport, SDK calls, and event triggers. Agents can be local processes (stdio) or remote services (HTTP/WebSocket). The agent picker handles configuration and credentials per agent, scoped per project.

## 5. v1 scope

**In:**

- Project list (a project = repo path + optional worktree set)
- Project creation from a local folder or git URL
- Multi-account git auth, per project
- Mission Control: cross-project running-agents view
- Agent picker — connect ACP agents (Claude Code default), connect SDK agents (Anthropic, OpenAI)
- Run an agent within a project, in Standard / Worktree / YOLO mode
- Per-agent live status, cost tracking, action log
- Approval prompts surfaced in Mission Control
- Native diff view with accept/reject per hunk (Monaco diff component)
- "Open in editor" action launching the user's configured editor on a file
- One example button-triggered agent shipped: "Generate commit message"
- One example event-triggered agent shipped: "On PR open, post review summary"
- Notification feed
- Optional VS Code extension for editor inflection (already scaffolded in Phase 0; opt-in)

**Out (v2+):**

- Embedded editor surface — Prism stays editor-less, period
- Zed / JetBrains / Neovim extensions — VS Code first, others later
- Subagent visualization (the prism/refraction metaphor) — second-order
- Named layout presets (Focus / Spread / Studio) — fixed layout for v1
- Task autostart / dev server orchestration — Shep does this fine, cross-link rather than replicate
- Cron-style agent scheduling — manual triggers only for v1
- Cloud sync, hosted version, team collaboration

## 6. Non-goals, forever

- We do not ship an editor. Pair with whatever you use.
- We do not host agents in the cloud. Local processes and user-supplied API keys.
- We do not phone home with agent output. Telemetry, if any, is opt-in and clearly disclosed.
- We do not reinvent terminals or full git GUIs.

## 7. Why this is a wedge

- **Zed has agents in the editor.** Prism has agents in their own room. Both can coexist.
- **Shep has terminals and CLI agents but no diff view.** Prism has supervision, event-driven runs, and a real diff surface.
- **Cursor / Windsurf** own vertically-integrated agent IDEs. Prism is layer-separable: bring your editor, bring your agent.
- **GitHub Copilot Workspace** is single-agent and cloud-hosted. Prism is BYO and local.
- **GitHub Desktop / Tower / GitKraken** are git GUIs without agents. Prism includes the git surface agents need to be trustworthy, not full git GUI parity.

The bet: as developers run more agents in parallel, *agent supervision with a real review surface* becomes its own job, separate from editing. Prism owns that job.

## 8. Architecture

Stack pinned in `PRISM_BASELINE.md`. Tauri 2 standalone app, Rust backend (process management / git / ACP / direct SDK calls / event scheduling), React frontend (Mission Control + Monaco diff). Localhost-only.

The VS Code extension scaffolded in Phase 0 is **optional**. Phase 1 ships a self-contained workspace — Prism renders diffs natively and shells out to the user's editor command (`code <path>`, `zed <path>`, etc.) when "Open" is clicked. The extension stays in the repo as opt-in editor inflection (active file, selection, diagnostics) for power users; the base experience doesn't require it.

## 9. Brand

Settled in `brand/README.md`. Voice: direct, utilitarian, dry humor when warranted, no emoji in product, no exclamation points. Wordmark and app icon use the chromatic-aberration treatment; UI icons stay clean.

## 10. Phased delivery

**Phase 0 — Foundation.** Done. Tauri + extension scaffold, IPC handshake working end-to-end.

**Phase 1 — Smallest useful (≈ 1–2 weeks).**
The thinnest Mission Control that solves a real Josh problem.
- Add a project from a local folder
- Connect Claude Code as an ACP agent for that project
- Start a chat session, see messages + tool calls in Prism
- Approve tool calls
- Native Monaco diff view for proposed file changes
- "Open in editor" action launching the user's configured editor
- Two-week daily-use trial begins here.

**Phase 2 — Multi-agent + multi-project (≈ 3 weeks).**
- Multiple agents per project, multiple projects
- Mode toggles (Standard / Worktree / YOLO)
- Approval prompts in Mission Control
- Notification feed

**Phase 3 — Broader agents (≈ 3 weeks).**
- Button-triggered tool: "Generate commit message"
- Event-triggered agent: "On PR open, post review summary"
- Multi-account git auth

**Phase 4 — Polish (≈ 2 weeks).**
- Cost tracking, action log per agent, settings UI

**Phase 5 — Public beta (≈ 2 weeks).**
- Cross-platform builds, onboarding, docs, signing

Total: ≈ 11 weeks from end of Phase 0 to v1 beta. Re-plan after each phase based on what Josh actually uses.
