import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import * as vscode from 'vscode';
import WebSocket from 'ws';
import type { Envelope } from '@prism/protocol';
import { PROTOCOL_VERSION } from '@prism/protocol';

const RECONNECT_MS = 2000;

type Status =
  | 'idle'
  | 'awaiting-port-file'
  | 'connecting'
  | 'connected'
  | 'handshake-complete'
  | 'reconnecting';

function configDir(): string {
  const home = os.homedir();
  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support');
  }
  if (process.platform === 'win32') {
    return process.env.APPDATA ?? path.join(home, 'AppData', 'Roaming');
  }
  return process.env.XDG_CONFIG_HOME ?? path.join(home, '.config');
}

const PORT_FILE = path.join(configDir(), 'prism', 'workspace.port');

export class WsClient {
  private ws: WebSocket | null = null;
  private status: Status = 'idle';
  private stopped = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly channel: vscode.OutputChannel) {}

  getStatus(): Status {
    return this.status;
  }

  start(): void {
    this.stopped = false;
    void this.connect();
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
    this.status = 'idle';
  }

  private async readPort(): Promise<number | null> {
    try {
      const text = await fs.readFile(PORT_FILE, 'utf8');
      const n = parseInt(text.trim(), 10);
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  }

  private scheduleReconnect(): void {
    if (this.stopped) return;
    this.status = 'reconnecting';
    this.timer = setTimeout(() => void this.connect(), RECONNECT_MS);
  }

  private async connect(): Promise<void> {
    if (this.stopped) return;

    this.status = 'awaiting-port-file';
    const port = await this.readPort();
    if (port === null) {
      this.channel.appendLine(`[prism] no port file at ${PORT_FILE}; retrying`);
      this.scheduleReconnect();
      return;
    }

    this.status = 'connecting';
    this.channel.appendLine(`[prism] connecting to ws://127.0.0.1:${port}`);
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    this.ws = ws;

    ws.on('open', () => {
      this.status = 'connected';
      const hello: Envelope = {
        type: 'hello',
        version: PROTOCOL_VERSION,
        sender: 'extension',
      };
      ws.send(JSON.stringify(hello));
    });

    ws.on('message', (data: WebSocket.RawData) => {
      let msg: Envelope;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        this.channel.appendLine('[prism] non-JSON message');
        return;
      }
      if (msg.type === 'hello-ack') {
        this.status = 'handshake-complete';
        this.channel.appendLine(
          `[prism] handshake complete; workspace v${msg.version}`,
        );
      }
    });

    ws.on('close', () => {
      this.channel.appendLine('[prism] connection closed');
      this.ws = null;
      this.scheduleReconnect();
    });

    ws.on('error', (err) => {
      this.channel.appendLine(`[prism] ws error: ${err.message}`);
    });
  }
}
