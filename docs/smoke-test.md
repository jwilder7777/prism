# Phase 0 smoke test

How to verify the IPC handshake between Prism Workspace and the VS Code extension end-to-end.

## Prerequisites

- Node 20+
- Rust stable (`rustup default stable`)
- pnpm: `npm install -g pnpm` (or via corepack if you have admin)
- VS Code installed and on `$PATH` (`code` command available)

## One-time setup

From the repo root:

```bash
pnpm install
```

This installs deps for all workspaces. Tauri pulls Rust crates lazily on first `tauri:dev` / `tauri:build`.

## Run the workspace app

```bash
cd apps/workspace
pnpm tauri:dev
```

First run downloads ~100 Rust crates and compiles them — expect 2–5 minutes. Subsequent runs are seconds.

When it boots you should see:

- The Prism wordmark (chromatic aberration on near-black) centered in a 1200x800 window
- A status indicator below the wordmark: "waiting for extension · port 49xxx"

The status reflects IPC state. The console (terminal where you ran `tauri:dev`) prints:

```
[prism] ws server listening on 49xxx, port file: <path>/prism/workspace.port
```

Note the port file location — the extension reads it to discover the running workspace.

## Run the extension

In another terminal:

```bash
cd apps/vscode-extension
pnpm build
code --extensionDevelopmentPath="$(pwd)" --new-window
```

A fresh VS Code window opens with Prism loaded. Open the Prism output channel (`View > Output`, pick "Prism" from the dropdown). You should see:

```
[prism] extension activating
[prism] connecting to ws://127.0.0.1:49xxx
[prism] handshake complete; workspace v0.0.0
```

Back in the workspace window, the status indicator should change to "handshake complete" (green dot).

Run `Prism: Show Connection Status` from the command palette to confirm — it should show `handshake-complete`.

## What's being tested

1. Workspace app boots and renders the wordmark.
2. Rust backend opens a WS server on a random localhost port.
3. Backend writes the port to `<config-dir>/prism/workspace.port`.
4. Extension reads the port file, opens a WS connection, sends `{type: "hello"}`.
5. Backend replies `{type: "hello-ack"}`.
6. Both sides log the handshake and the workspace UI updates.

If any step fails, the extension auto-reconnects every 2 seconds — closing and re-opening the workspace app should re-establish the handshake without restarting VS Code.
