use std::path::PathBuf;

use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::{accept_async, tungstenite::Message};

const VERSION: &str = "0.0.0";

/// Wire envelope. Mirror of `packages/protocol/src/index.ts`. Keep in sync.
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type", rename_all = "kebab-case")]
enum Envelope {
    Hello {
        version: String,
        sender: String,
    },
    HelloAck {
        version: String,
        sender: String,
    },
    Ping {
        id: String,
    },
    Pong {
        id: String,
    },
}

fn port_dir() -> Option<PathBuf> {
    let mut p = dirs::config_dir()?;
    p.push("prism");
    Some(p)
}

pub async fn start_server(
    app: AppHandle,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let listener = TcpListener::bind("127.0.0.1:0").await?;
    let port = listener.local_addr()?.port();

    if let Some(dir) = port_dir() {
        std::fs::create_dir_all(&dir)?;
        let file = dir.join("workspace.port");
        std::fs::write(&file, port.to_string())?;
        eprintln!(
            "[prism] ws server listening on {port}, port file: {}",
            file.display()
        );
    } else {
        eprintln!("[prism] could not resolve config dir; extension will not find us");
    }

    let _ = app.emit("ipc:listening", port);

    while let Ok((stream, _)) = listener.accept().await {
        let app = app.clone();
        tokio::spawn(async move {
            if let Err(e) = handle_connection(stream, app).await {
                eprintln!("[prism] connection error: {e}");
            }
        });
    }

    Ok(())
}

async fn handle_connection(
    stream: TcpStream,
    app: AppHandle,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut ws = accept_async(stream).await?;
    let _ = app.emit("ipc:peer-connected", ());

    while let Some(msg) = ws.next().await {
        let msg = msg?;
        let text = match msg {
            Message::Text(t) => t,
            Message::Close(_) => break,
            _ => continue,
        };

        let env: Envelope = match serde_json::from_str(&text) {
            Ok(e) => e,
            Err(e) => {
                eprintln!("[prism] bad envelope: {e}");
                continue;
            }
        };

        match env {
            Envelope::Hello { version, sender } => {
                eprintln!("[prism] hello from {sender} v{version}");
                let ack = Envelope::HelloAck {
                    version: VERSION.to_string(),
                    sender: "workspace".to_string(),
                };
                let payload = serde_json::to_string(&ack)?;
                ws.send(Message::Text(payload.into())).await?;
                let _ = app.emit("ipc:handshake", ());
            }
            Envelope::Ping { id } => {
                let pong = Envelope::Pong { id };
                let payload = serde_json::to_string(&pong)?;
                ws.send(Message::Text(payload.into())).await?;
            }
            Envelope::HelloAck { .. } | Envelope::Pong { .. } => {
                // Workspace doesn't expect these inbound; ignore.
            }
        }
    }

    let _ = app.emit("ipc:peer-disconnected", ());
    Ok(())
}
