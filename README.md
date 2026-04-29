# Prism

Mission control for coding agents. Run as many as you want, across as many projects as you have, with whatever editor you use. See what they're all doing at a glance. Approve their work without losing context.

A standalone Tauri app. Editor-less by design — diffs render natively in the Prism window; click to open files in your editor of choice (VS Code, Zed, whatever). Bring any [ACP](https://agentclientprotocol.com)-compliant agent. An optional VS Code extension adds editor inflection for power users.

Phase 0 is done. See [`docs/PRD.md`](docs/PRD.md) for product, [`PRISM_BASELINE.md`](PRISM_BASELINE.md) for stack, [`docs/smoke-test.md`](docs/smoke-test.md) for verifying the IPC handshake.

## Layout

- `apps/workspace/` — standalone Tauri 2 app (Rust backend + React frontend). Owns project list, agent sessions, terminals, tasks.
- `apps/vscode-extension/` — VS Code extension (TypeScript). Bridges editor state to the workspace app.
- `packages/protocol/` — shared TS types for the IPC channel between the two halves.
- `brand/` — design assets.
- `docs/` — product docs.

## License

MIT
