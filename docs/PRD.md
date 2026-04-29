# Prism — Product Requirements Document

**Version:** 0.1 (Draft)
**Status:** Pre-development — pending architecture review
**Owner:** Josh
**Last updated:** April 29, 2026

---

## 1. Summary

Prism is an open, agent-native development workspace built on a VS Code fork. It organizes work around projects rather than folders, runs coding agents in parallel as first-class citizens, and lets users bring any agent that speaks the [Agent Client Protocol (ACP)](https://agentclientprotocol.com) — Claude Code, Gemini CLI, OpenCode, or anything compliant. The default experience ships with Claude Code; the architecture supports any ACP agent.

The product sits at the intersection of three trends that are all happening in 2026:

1. The Agent Client Protocol is becoming the LSP-of-coding-agents (Zed, JetBrains, Claude Code, Gemini CLI, Warp on roadmap).
2. Project-and-task-oriented workspaces (Shep) are proving more useful than folder-oriented editors for real multi-repo, multi-agent work.
3. Developers want agent choice without abandoning a familiar editor (the VS Code substrate).

Cursor and Windsurf are agent-locked. Claude Code is great but terminal-thin. Warp is terminal-first. Zed is its own editor with its own audience. The lane Prism owns: **VS Code-quality editor + Shep-style project workspace + ACP-native multi-agent + parallel agent runs as a headline feature.**

---

## 2. Goals and non-goals

### Goals

- Ship a desktop IDE on macOS, Linux, and Windows that feels like VS Code but reorganizes the UI around projects and agents rather than folders.
- Be ACP-native from day one. Any ACP-compliant agent should work without per-agent integration code in Prism's core.
- Treat parallel agent work as a primary use case, not an edge case. Multiple agents on the same project at the same time is supported and visible.
- Make project workspaces the top-level navigation primitive. Each project carries its own agent sessions, tasks, terminals, and layout.
- Match VS Code's editor quality. Inherit Monaco, the extension API, debugger, terminal, language servers.
- Configurability that mirrors Shep: layouts, modes (Standard / Worktree / YOLO), per-project autostart tasks, customizable terminal grouping.
- Default to Claude Code so new users have a one-click "it works" experience.

### Non-goals (for v1)

- Building a custom agent. Prism is the workspace, not the model.
- Hosted/cloud version. Desktop-only for v1.
- Replacing the VS Code extension ecosystem. Extensions should keep working.
- Mobile or web versions.
- Team collaboration features (shared sessions, multiplayer editing). v2 territory.
- Custom typeface or icon set. Use Geist Sans / Geist Mono and Lucide.

---

## 3. Target user

The primary user is an experienced developer who:

- Already uses VS Code or a fork and is comfortable with the keyboard-driven editor model.
- Works across multiple repositories regularly — agency, freelancer, founder, platform engineer.
- Has tried Cursor, Windsurf, Claude Code, or similar AI-IDE tools and finds something missing.
- Runs coding agents as part of daily work and wants more control over which agent does what.
- Values configurability over opinion. Doesn't want the IDE to make their layout choices for them.

Secondary users include teams that want the same workspace tool but standardized across the team, and developers who specifically want agent-portability (because their employer mandates a certain agent, or because they're testing across multiple).

---

## 4. Product principles

These guide decisions when the spec is silent.

**Workspace-first, not editor-first.** The sidebar lists projects, not files. The editor is one view inside a project. Tabs across the top can be files, agent conversations, terminals, diffs — the project is the unit, the editor is in service of it.

**Agent-agnostic by architecture, opinionated by default.** ACP is the only agent integration mechanism in Prism's core. Claude Code is the default agent because it's a great experience for new users, but the codebase has zero hard dependencies on it.

**Parallel is normal.** Multiple agents on the same project, multiple subagents within an agent run, multiple sessions across multiple projects — all standard. The UI never treats parallelism as a special case.

**Configurability is brand-level.** Layouts are user-owned. The IDE never tells the user how to arrange their work. Named layout presets per project, swappable in one keystroke.

**Match VS Code's quality bar where possible.** Don't reinvent the editor. Don't reinvent debugging. Don't reinvent the terminal. Reinvent the workspace layer above them.

**Direct over delightful.** Voice is utilitarian. Mode names like "YOLO" are allowed and encouraged when the literal name is the right name. No marketing puffery in product surfaces.

---

## 5. Core concepts and vocabulary

These are the user-facing nouns. Internal code may use different names but the UI and docs commit to these.

| Term | Meaning |
|---|---|
| **Project** | A workspace anchored to a repo (or set of repos). Top-level organizing unit. Has its own agent sessions, tasks, terminals, layout, and settings. |
| **Agent** | An ACP-compliant coding agent connected to Prism. Can be local (subprocess, stdio) or remote (HTTP/WebSocket). |
| **Session** | An active conversation between the user and an agent within a project. A project can have multiple concurrent sessions, including with different agents. |
| **Run** | A single agent turn within a session — prompt, response, tool calls, output. Sessions are sequences of runs. |
| **Task** | A configured background process the project depends on. Dev server, watcher, test runner, type checker. Lives at the project level, autostartable. |
| **Mode** | How an agent operates within the project. Three modes: Standard (in your repo), Worktree (in an isolated git worktree), YOLO (no approval prompts, full auto). |
| **Layout** | A named arrangement of editor panes, agent panels, terminals, and tasks. Per-project, switchable in one keystroke. |

---

## 6. Architecture overview

### Substrate

Fork VS Code (Code - OSS) at a stable release tag. Set up a contrib directory pattern (`src/vs/workbench/contrib/prism/`) that contains all Prism-specific code, isolated from upstream so rebases are tractable. Strip GitHub Copilot Chat and any Copilot-specific surfaces from the build.

The fork's primary modifications are at the workbench layer (sidebar, activity bar, layout system) and the agent integration layer (new). The editor, language services, debugger, terminal, and extension API remain untouched.

Reference architecture: [opencode-vscode-ide](https://github.com/cpkt9762/opencode-vscode-ide) — vendored SPA agent UI in `contrib/`, loopback proxy in Electron main, managed agent backend lifecycle. Prism uses the same pattern but routes to ACP servers instead of OpenCode's serve backend.

### ACP integration layer

Prism is an ACP **client**. The integration layer:

- Manages ACP server processes (spawn, stdio, lifecycle, cleanup).
- Speaks ACP over JSON-RPC for local agents (stdio transport).
- Speaks ACP over HTTP/WebSocket for remote agents.
- Translates ACP concepts (sessions, prompt turns, tool calls, file system, terminals, plans, slash commands) into Prism UI surfaces.
- Surfaces ACP capabilities to the user (which agent supports which features).

Use the official ACP TypeScript library (`@zed-industries/agent-client-protocol`) as the foundation. No custom protocol code where the library covers it.

### Project workspace layer

This is the new top-level UI. Lives in a Prism-specific contrib module. Provides:

- Project list (sidebar primary view).
- Per-project state (sessions, tasks, terminals, layout, agent connections).
- Project switcher (keyboard-driven, fast).
- Project creation / import (from existing folder, from git URL, from worktree).

Projects are stored in a SQLite database in the user's data directory. Per-project metadata lives alongside in JSON for human-readability and version control friendliness (a `.prism/` directory at the project root, gitignorable).

### Layout system

VS Code's layout is replaced with a Prism layout system that supports:

- Named presets per project ("Focus", "Spread", "Studio" — and user-defined).
- Pane types beyond editor: agent conversation, terminal, task output, diff viewer.
- Drag-to-rearrange like VS Code, but layouts are saved and switchable.
- One keystroke to cycle layouts within a project.

### Agent picker

A first-class UI for managing agents. Lives in the activity bar. Lets users:

- Connect a local agent (browse for binary, configure args, save credentials).
- Connect a remote agent (URL, auth method).
- Switch the default agent for a project.
- Spawn a new session with a specific agent on demand.
- See all currently running agents across all projects.

### Default agent: Claude Code

Prism ships with Claude Code pre-configured. First-run flow: user signs into Claude Code, Prism handles the OAuth, the user is ready. No manual config. Other agents are added via "Connect another agent" in the picker.

---

## 7. Functional requirements (v1)

### 7.1 Project management
- Create a project from an existing local folder.
- Create a project from a git URL (clone-on-create).
- Open a project (switch the workspace context).
- Close a project (preserves state for next open).
- Delete a project from Prism (does not delete the folder).
- Pin / unpin projects in the sidebar.
- Search across projects by name or recently-used.

### 7.2 Sessions and agents
- Start a new agent session within a project.
- Switch which agent a session uses (if the conversation can be migrated; otherwise prompt to start fresh).
- Run multiple sessions in parallel within one project.
- Run sessions across multiple projects simultaneously.
- Pause / resume sessions.
- Persist session history per project across app restarts.
- Show session status at a glance (idle, awaiting input, running, awaiting approval, errored).

### 7.3 Modes
- Standard mode: agent runs in the project's working directory, normal approval prompts.
- Worktree mode: agent runs in a freshly-created git worktree, isolated from the main checkout. User can preview agent's work in a side editor without leaving their main branch.
- YOLO mode: agent runs without approval prompts. Visually marked clearly. Toggleable per session.

### 7.4 Tasks
- Configure named tasks per project (command + cwd + env).
- Mark tasks as autostart (run when project is opened).
- Show task status in the project sidebar.
- Stop / restart tasks individually.
- Tasks output piped to a dedicated pane in the layout.

### 7.5 Layouts
- Three default layout presets shipped: Focus (editor-only with collapsed agent), Spread (editor + agent + terminal), Studio (everything visible).
- Save current arrangement as a named layout.
- Switch layouts via command palette or keyboard shortcut.
- Layouts are per-project but can be promoted to user defaults.

### 7.6 Editor inflection
- Agents can read the active editor's file path, current selection, visible range, and recent edits via ACP's file system primitives.
- `@file` and `@selection` mentions in agent prompts resolve against the actual editor state.
- Clicking a file in the tree updates the agent's context awareness (passive — agent reads on demand).
- Diagnostics (problems panel) are exposed to agents via ACP.

### 7.7 ACP feature parity
Prism should surface every ACP feature that has UI value:
- Tool call display and approval prompts.
- File system operations with diff preview before apply.
- Terminal access requests (agents can spawn terminals; user sees them in the layout).
- Agent plans (multi-step plans rendered as checklists).
- Session modes (when the agent advertises them via ACP).
- Slash commands (agent-specific commands, surfaced via Prism's command palette).

### 7.8 Subagent visualization
When an agent spawns subagents (Claude Code's pattern), Prism shows them as nested sessions within the parent. User can expand/collapse, see status per subagent, and intervene if needed. The brand metaphor (one input, multiple refractions) lives here.

### 7.9 First-run experience
- Sign into Claude Code via OAuth.
- Optional: import VS Code settings / extensions.
- Walk through creating the first project.
- Show the three layout presets and explain switching.

---

## 8. Non-functional requirements

**Performance.** First contentful paint within 2 seconds on M1 / Ryzen 5 hardware. Project switch within 200ms. Agent session spawn within 500ms (excluding agent process startup, which is the agent's responsibility).

**Reliability.** Agent process crashes do not crash Prism. Session state is preserved across crashes. Per-project state is durable across app restarts.

**Cross-platform.** macOS (Intel + Apple Silicon), Linux (x64 + ARM64), Windows (x64). Code-signed releases on macOS and Windows.

**Updates.** Auto-update via VS Code's existing update infrastructure. Channel: stable + insiders.

**Privacy.** Agent traffic goes only between the user's machine and the agent's endpoint. Prism does not phone home with agent contents. Telemetry (if any) is opt-in and clearly disclosed.

**Accessibility.** Inherit VS Code's accessibility tree. Keyboard navigation for every Prism-specific UI. Screen-reader labels on all custom controls.

---

## 9. Brand and design system

These are settled and not up for v1 debate. Detail lives in the brand brief; summarized here.

- **Wordmark:** "prism" lowercase, Geist Black (900), with chromatic aberration treatment (magenta `#FF1F8E` and cyan `#1FE6FF` ghosts at ~55% opacity behind a white `#FAFAF9` foreground using `mix-blend-mode: screen`).
- **App icon:** Lowercase "p" in the same chromatic aberration treatment, on a near-black tile (`#0F0F10`), rounded square per platform conventions.
- **Aberration usage:** Wordmark and app icon only. UI icons stay clean.
- **Typography:** Geist Sans (UI, body), Geist Mono (code, terminal, agent logs). OFL licensed, free.
- **Icons:** Lucide, 1.5px stroke, 16px and 20px standard sizes, rounded line caps.
- **Substrate:** Near-black `#0A0A0B` background, near-white `#FAFAF9` foreground.
- **Accent palette (semantic, never decorative):** Muted five-point spectrum used for agent identity / run state. Colors finalized in brand brief.
- **Voice:** Direct, utilitarian, dry humor allowed when warranted (mode names like "YOLO"). No emoji in product. No exclamation points.

---

## 10. Risks and open questions

**Risk: VS Code rebase pain.** Mitigation: strict contrib directory discipline, minimal core diffs. Re-evaluate after first quarterly upstream rebase.

**Risk: ACP is still maturing.** The protocol is in active development. Mitigation: use the official library, contribute back upstream when we hit gaps, treat ACP as a moving target with versioning.

**Risk: Claude Code's ACP surface may not cover everything we want.** Some Claude Code features may only be available via the SDK, not via ACP. Mitigation: design the integration layer so a Claude-Code-specific extension module *could* be added later if needed, but keep it out of v1.

**Risk: "Bring your own agent" dilutes the marketing.** Mitigation: lead with "Claude Code, ready out of the box" for new users. ACP is a power-user / strategic message.

**Open: Worktree mode UX.** Does the editor swap to the worktree directory when the agent runs there, or does the user stay on main while the agent works headlessly? Probably the latter, with a "preview agent's worktree" pane available on demand. Needs prototyping.

**Open: How aggressive is editor inflection?** Passive (agent reads on demand) vs active (every selection change pushes context). Start passive, observe usage, decide based on real behavior.

**Open: Project-level vs session-level agent selection.** A project has a default agent, but each new session can override it. Is the default sticky (next session inherits the override) or non-sticky (next session reverts to project default)? Lean non-sticky for predictability.

**Open: Pricing model.** Free for v1. Open question whether teams/enterprise tier appears in v2. Decide later.

---

## 11. Success metrics

For v1 launch:

- 1,000+ GitHub stars in the first month.
- 10,000+ downloads in the first 90 days.
- 30% of installs configure a non-Claude-Code agent within 30 days (validates the ACP-native bet).
- Median user has 3+ projects in their workspace within 14 days (validates the project-first model).
- Day 7 retention above 40% for users who complete the first-run flow.

These are starting targets, not commitments. Adjust after the first milestone.

---

## 12. Phased delivery

### Phase 0 — Foundation (weeks 1–3)
Fork VS Code, set up the contrib directory, strip Copilot Chat, get a buildable Prism with no Prism features yet. CI/CD pipeline, signed builds, update channel.

### Phase 1 — Project workspace (weeks 4–7)
Project sidebar, project creation/import, project switcher, per-project state in SQLite + `.prism/` directory. Layout system with three preset arrangements. No agents yet.

### Phase 2 — ACP integration (weeks 8–11)
ACP client implementation. Local agent process management. Agent picker UI. Single-session-per-project working end to end. Tool call display, approval prompts, file system operations with diff preview.

### Phase 3 — Default Claude Code experience (weeks 12–14)
Claude Code OAuth flow, first-run experience, default agent configuration. Public alpha release.

### Phase 4 — Parallelism and modes (weeks 15–18)
Multiple sessions per project. Standard / Worktree / YOLO modes. Subagent visualization. Session status indicators.

### Phase 5 — Polish and tasks (weeks 19–22)
Tasks (autostart, status, output panes). Editor inflection refinement. Slash commands. Agent plans rendering. Public beta.

### Phase 6 — v1 launch (weeks 23–26)
Cross-platform builds, code signing, marketing site, docs, launch announcement.

This is approximate. Reality will differ. Re-plan after each phase.
