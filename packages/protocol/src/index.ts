/**
 * IPC protocol between Prism Workspace (Tauri app) and the VS Code extension.
 *
 * Wire format: JSON over a single localhost WebSocket. Workspace is the server,
 * extension is the client. Both sides re-implement the same message shapes —
 * Rust types live in `apps/workspace/src-tauri/src/ipc.rs`. Keep them in sync.
 */

export const PROTOCOL_VERSION = '0.0.0';

export type Sender = 'workspace' | 'extension';

export interface Hello {
  type: 'hello';
  version: string;
  sender: Sender;
}

export interface HelloAck {
  type: 'hello-ack';
  version: string;
  sender: Sender;
}

export interface Ping {
  type: 'ping';
  id: string;
}

export interface Pong {
  type: 'pong';
  id: string;
}

export type Envelope = Hello | HelloAck | Ping | Pong;
