# Prism

Agent-native development workspace. A standalone Tauri app paired with a VS Code extension. Bring any [ACP](https://agentclientprotocol.com)-compliant agent.

This repo is at the start of Phase 0. See [`docs/PRD.md`](docs/PRD.md) for product context and [`PRISM_BASELINE.md`](PRISM_BASELINE.md) for stack decisions.

## Layout

- `apps/workspace/` — standalone Tauri 2 app (Rust backend + React frontend). Owns project list, agent sessions, terminals, tasks.
- `apps/vscode-extension/` — VS Code extension (TypeScript). Bridges editor state to the workspace app.
- `packages/protocol/` — shared TS types for the IPC channel between the two halves.
- `brand/` — design assets.
- `docs/` — product docs.

## License

MIT
