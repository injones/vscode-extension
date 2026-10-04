import { TextDecoder, TextEncoder } from "util";
import { Disposable, Event, FileChangeEvent, FileStat, FileSystemProvider, FileType, Uri, FileSystemError, EventEmitter } from "vscode";
import path from "path";

export const PINFS_FILE_NAME = 'pins.txt';
// Length should match the commands listed in package.json
export const PINFS_LENGTH = 4;

export class PinFS implements FileSystemProvider {
    pins: string[] = [];
    length: number = PINFS_LENGTH;
    decoder: TextDecoder = new TextDecoder('utf-8');
    encoder: TextEncoder = new TextEncoder();

    watch(uri: Uri, options: { readonly recursive: boolean; readonly excludes: readonly string[]; }): Disposable {
        throw new Error("Method not implemented.");
    }
    stat(uri: Uri): FileStat {
        if (uri.path !== `/${PINFS_FILE_NAME}`) {
            throw FileSystemError.FileNotFound();
        } 

        const initialFileSize = 0;
        const fileSize = this.pins.reduce(
            (acc, current) => acc + this.encoder.encode(current).length,
            initialFileSize
        );
        return {
            type: FileType.File,
            size: fileSize,
            ctime: Date.now(),
            mtime: Date.now()
        }
    }
    readDirectory(uri: Uri): [string, FileType][] | Thenable<[string, FileType][]> {
        throw new Error("Method not implemented.");
    }
    createDirectory(uri: Uri): void | Thenable<void> {
        throw new Error("Method not implemented.");
    }
    readFile(uri: Uri): Uint8Array {
        if (uri.path !== `/${PINFS_FILE_NAME}`) {
            throw FileSystemError.FileNotFound();
        }
        return this.encoder.encode(this.pins.join("\n"));
    }
    writeFile(uri: Uri, content: Uint8Array, options: { readonly create: boolean; readonly overwrite: boolean; }): void {
        if (uri.path !== `/${PINFS_FILE_NAME}`) {
            throw FileSystemError.FileNotFound();
        }

        const txt = this.decoder.decode(content);

        let updatedPins: string[] = [];

        const splitTxt = txt.split("\n", this.length);
        splitTxt.forEach((currentPath) => {
            if (path.isAbsolute(currentPath)) {
                updatedPins.push(currentPath);
            }
        });

        this.pins = updatedPins;
    }
    delete(uri: Uri, options: { readonly recursive: boolean; }): void | Thenable<void> {
        throw new Error("Method not implemented.");
    }
    rename(oldUri: Uri, newUri: Uri, options: { readonly overwrite: boolean; }): void | Thenable<void> {
        throw new Error("Method not implemented.");
    }
    copy?(source: Uri, destination: Uri, options: { readonly overwrite: boolean; }): void | Thenable<void> {
        throw new Error("Method not implemented.");
    }

    private readonly _onDidChangeFile = new EventEmitter<FileChangeEvent[]>()
    readonly onDidChangeFile: Event<FileChangeEvent[]> = this._onDidChangeFile.event;
}