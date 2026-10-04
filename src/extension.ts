import * as vscode from 'vscode';
import { gitStatusOpen } from './status';
import { PinFS, PINFS_LENGTH } from './pinFileSystemProvider';
import { pin, editPins, showPins, gotoPin } from './pinning';

export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand('tardis.status', async () => {
		await gitStatusOpen();
	});

	context.subscriptions.push(disposable);

	const pinFs = new PinFS();
	context.subscriptions.push(vscode.workspace.registerFileSystemProvider('pinfs', pinFs, { isCaseSensitive: true, isReadonly: false }));
	
	context.subscriptions.push(vscode.commands.registerCommand('tardis.pin', () => {
		pin(pinFs);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('tardis.pins', async () => {
		await editPins();
	}));

	for (let i = 1; i < PINFS_LENGTH; i++) {
		context.subscriptions.push(vscode.commands.registerCommand(`tardis.gotoPin${i}`, async () => {
			await gotoPin(pinFs, i);
		}));
	}

	context.subscriptions.push(vscode.commands.registerCommand('tardis.quickPins', async () => {
		await showPins(pinFs);
	}));
}

// This method is called when your extension is deactivated
export function deactivate() {}
