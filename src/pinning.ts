import { PinFS, PINFS_FILE_NAME } from "./pinFileSystemProvider";
import { IconPath, QuickPickItem, ThemeIcon, Uri, window, workspace, Disposable } from "vscode";

const decoder = new TextDecoder();
const encoder = new TextEncoder();
const PIN_FILE = `pinfs:/${PINFS_FILE_NAME}`;

class PinItem implements QuickPickItem {
    label: string = '';
    iconPath?: IconPath = ThemeIcon.File;
    resourceUri?: Uri | undefined;

    constructor(public resource: Uri) {
        this.resourceUri = resource;
    }
}

export function pin(pinFs: PinFS) : void {
    const activeEditor = window.activeTextEditor;
    if (!activeEditor || activeEditor.document.uri.scheme === 'pinfs') {
        return;
    }

    const rawText = pinFs.readFile(Uri.parse(PIN_FILE));
    const txt = decoder.decode(rawText);
    const currentPins = txt.length > 0 ? txt.split("\n") : [];
    currentPins.push(activeEditor.document.fileName);
    const updatedPins = currentPins.join("\n");
    pinFs.writeFile(Uri.parse(PIN_FILE), encoder.encode(updatedPins), { create: true, overwrite: true });
}

export async function editPins() {
    const document = await workspace.openTextDocument(Uri.parse(PIN_FILE));
	await window.showTextDocument(document);
}

export async function gotoPin(pinFs: PinFS, index: number) {
    const rawText = pinFs.readFile(Uri.parse(PIN_FILE));
    const txt = decoder.decode(rawText);
    const currentPins = txt.length > 0 ? txt.split("\n") : [];
    if (currentPins.length < index) {
        return;
    }

    const selected = currentPins[index - 1];
    try {
        const document = await workspace.openTextDocument(Uri.file(selected));
        await window.showTextDocument(document);
    } catch (error) {
        window.showErrorMessage("Exception occurred whilst attempting to open the file: %s", selected);
    }
}

async function showQuickPick(items: PinItem[]) {
    const disposables: Disposable[] = [];
    try {
        return await new Promise<Uri | undefined>((resolve) => {
            const input = window.createQuickPick<PinItem>();
            input.title = "Pinned files";
            input.placeholder = "Goto pin...";
            input.items = items;
            disposables.push(
                input.onDidChangeSelection(async items => {
                    const item = items[0];
                    if (item && item instanceof PinItem) {
                        resolve(item.resourceUri);
                        input.hide();
                    }
                }),
                input.onDidHide(() => {
                    resolve(undefined);
                    input.dispose();
                }),
            )
            input.show();
        })
    } finally {
        disposables.forEach(d => d.dispose());
    }
}

export async function showPins(pinFs: PinFS) {
    const rawText = pinFs.readFile(Uri.parse(PIN_FILE));
    const txt = decoder.decode(rawText);
    const currentPins = txt.length > 0 ? txt.split("\n") : [];

    const pinItems = currentPins.map((pin) => {
        return new PinItem(Uri.file(pin));
    });

    const uri = await showQuickPick(pinItems);
    if (uri) {
        const document = await workspace.openTextDocument(uri);
        await window.showTextDocument(document);
    }
}