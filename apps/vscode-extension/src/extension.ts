import * as vscode from 'vscode';
import { WsClient } from './wsClient';

let client: WsClient | undefined;

export function activate(context: vscode.ExtensionContext) {
  const channel = vscode.window.createOutputChannel('Prism');
  context.subscriptions.push(channel);

  channel.appendLine('[prism] extension activating');

  client = new WsClient(channel);
  client.start();

  context.subscriptions.push(
    vscode.commands.registerCommand('prism.showStatus', () => {
      const status = client?.getStatus() ?? 'unknown';
      vscode.window.showInformationMessage(`Prism: ${status}`);
    }),
  );

  context.subscriptions.push({
    dispose: () => {
      client?.stop();
      client = undefined;
    },
  });
}

export function deactivate() {
  client?.stop();
  client = undefined;
}
