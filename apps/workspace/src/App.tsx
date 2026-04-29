import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';

type IpcStatus = 'starting' | 'listening' | 'peer-connected' | 'handshake' | 'peer-disconnected';

export function App() {
  const [status, setStatus] = useState<IpcStatus>('starting');
  const [port, setPort] = useState<number | null>(null);

  useEffect(() => {
    const unlisteners: Array<() => void> = [];

    listen<number>('ipc:listening', (e) => {
      setPort(e.payload);
      setStatus('listening');
    }).then((u) => unlisteners.push(u));

    listen('ipc:peer-connected', () => setStatus('peer-connected'))
      .then((u) => unlisteners.push(u));

    listen('ipc:handshake', () => setStatus('handshake'))
      .then((u) => unlisteners.push(u));

    listen('ipc:peer-disconnected', () => setStatus('peer-disconnected'))
      .then((u) => unlisteners.push(u));

    return () => {
      for (const u of unlisteners) u();
    };
  }, []);

  return (
    <div className="page">
      <div className="stage" role="img" aria-label="prism">
        <span className="ghost-m" aria-hidden="true">prism</span>
        <span className="ghost-c" aria-hidden="true">prism</span>
        <span className="top">prism</span>
      </div>
      <div className="status">
        <span className={`dot dot-${status}`} aria-hidden="true" />
        <span className="label">{statusLabel(status)}{port !== null ? ` · port ${port}` : ''}</span>
      </div>
    </div>
  );
}

function statusLabel(s: IpcStatus): string {
  switch (s) {
    case 'starting': return 'starting ipc';
    case 'listening': return 'waiting for extension';
    case 'peer-connected': return 'extension connected';
    case 'handshake': return 'handshake complete';
    case 'peer-disconnected': return 'extension disconnected';
  }
}
