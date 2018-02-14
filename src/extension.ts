'use strict';
import { debug } from 'util';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  let terminalStack: vscode.Terminal[] = [];

  function getLatestTerminal() {
    return terminalStack[terminalStack.length - 1];
  }

  function getJestPath(debugMode: boolean): string {
    const jestPath: string = vscode.workspace.getConfiguration().get('jestrunner.jestPath');
    if (jestPath) {
      return jestPath;
    }
    const jestDirectoy = process.platform.includes('win32')
      ? 'node_modules/jest/bin/jest.js'
      : 'node_modules/.bin/jest';
    if (debugMode) {
      return '${workspaceFolder}/' + jestDirectoy;
    }
    return jestDirectoy;
  }

  function getConfigPath(debugMode: boolean): string {
    const configPath: string = vscode.workspace.getConfiguration().get('jestrunner.configPath');
    if (!configPath) {
      return;
    }
    if (debugMode) {
      return '${workspaceFolder}/' + configPath;
    }
    return configPath;
  }

  vscode.window.onDidCloseTerminal(() => {
    terminalStack = [];
  });

  const runJest = vscode.commands.registerCommand('extension.runJest', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const configuration = getConfigPath(false);
    const selection = editor.selection;
    const text = editor.document.getText(selection);

    const jestPath = getJestPath(false);

    if (terminalStack.length === 0) {
      terminalStack.push(vscode.window.createTerminal('jest'));
    }

    let command = `node ${jestPath} -t '${text}'`;
    if (configuration) {
      command += ` -c '${configuration}'`;
    }
    const terminal = getLatestTerminal();
    terminal.show();
    terminal.sendText(command);
  });

  const debugJest = vscode.commands.registerCommand('extension.debugJest', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const configuration = getConfigPath(true);
    const selection = editor.selection;
    const text = editor.document.getText(selection);

    const config = {
      args: [],
      console: 'integratedTerminal',
      internalConsoleOptions: 'neverOpen',
      name: 'Debug Jest Tests',
      request: 'launch',
      type: 'node'
    };

    config.args.push('--inspect-brk');
    config.args.push(getJestPath(true));
    config.args.push('-i');
    if (configuration) {
      config.args.push('-c');
      config.args.push(configuration);
    }
    config.args.push('-t');
    config.args.push(text);
    vscode.debug.startDebugging(undefined, config);
  });

  context.subscriptions.push(runJest);
  context.subscriptions.push(debugJest);
}

export function deactivate() {
  // deactivate
}
