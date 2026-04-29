# Open questions

Phase 0 questions live here until resolved. When resolved, either move to a more permanent doc or delete.

## Architecture

- **ACP client crate.** Zed publishes the official ACP TS library. Need to confirm whether they ship a Rust crate or whether we implement the JSON-RPC protocol directly against the spec.
- **IPC transport.** WebSocket assumed for now. Named pipes / Unix sockets may be more idiomatic per OS — revisit if WS proves limiting.
- **Project state durability.** PRD says SQLite + `.prism/` JSON. Confirm SQLite via Tauri SQL plugin vs. embedded `rusqlite`.

## Product

(none yet)
