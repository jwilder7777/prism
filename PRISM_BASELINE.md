# Prism Baseline

**Last updated:** 2026-04-29

This file pins the stack and architecture decisions made at project start. Update with rationale when changing course.

## Architecture

Two products, talking over local IPC:

1. **Prism Workspace** (`apps/workspace/`) — standalone Tauri 2 app. Rust backend, React frontend. Owns project list, agent sessions, terminals, tasks, layouts. Hosts the ACP client. Primary user-facing surface.
2. **Prism for VS Code** (`apps/vscode-extension/`) — thin VS Code extension. Surfaces editor state to the workspace app, renders agent diffs in VS Code's diff editor, exposes a few command-palette entries.

The two communicate over a localhost WebSocket. The workspace app starts the server; the extension connects on activation.

## Stack pins

| Layer | Choice | Notes |
|---|---|---|
| Workspace shell | Tauri 2 | Cross-platform from day one |
| Workspace backend | Rust (stable) | PTY, agent process lifecycle, ACP client |
| Workspace frontend | React 19 + TypeScript + Vite | |
| Workspace state | Zustand | |
| Terminal rendering | xterm.js | |
| Package manager | pnpm | Workspaces in `pnpm-workspace.yaml` |
| Extension | VS Code TS extension API | |
| ACP | Rust client (crate selection pending) | Zed publishes a Rust impl; confirm in Phase 0 |
| IPC | WebSocket on localhost loopback | JSON-RPC framing |

## What this repo is NOT

- **Not a fork of VS Code.** Considered and rejected — rebase tax for a solo project is too high. Pair with VS Code via extension instead.
- **Not a fork of Shep.** Same shape, different implementation. Cross-platform from day one (Shep is macOS-only) and ACP-native (Shep has hardcoded per-agent launchers).

## Toolchain versions at baseline

- Node 22.18
- Rust 1.94 (rustup 1.28)
- pnpm 9.15 (to be installed)

## Open questions

Tracked in [`docs/open-questions.md`](docs/open-questions.md).
