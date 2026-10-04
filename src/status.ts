import { extensions, window, QuickPickItem, QuickPickItemKind, Uri, Disposable, workspace, IconPath, ThemeIcon, QuickInputButton, QuickInputButtonLocation } from 'vscode';
import { GitExtension, Repository } from './git';

const BUTTONTYPE = {
    PLUS: "plus",
    REMOVE: "remove"
}
type ButtonType = typeof BUTTONTYPE[keyof typeof BUTTONTYPE];

class GitSeparator implements QuickPickItem {
    label: string;
    kind?: QuickPickItemKind | undefined = QuickPickItemKind.Separator;
    
    constructor(public separatorName: string) {
        this.label = separatorName;
    }
}

class GitChangeButton implements QuickInputButton {
    iconPath: IconPath;
    location?: QuickInputButtonLocation | undefined = QuickInputButtonLocation.Inline;
    tooltip?: string | undefined;

    constructor(public iconId: string, public toolTip?: string) {
        this.iconPath = new ThemeIcon(iconId)
        this.tooltip = toolTip;
    }
}

class GitChangeItem implements QuickPickItem {
    label: string;
    resourceUri?: Uri | undefined;
    iconPath?: IconPath | undefined = ThemeIcon.File;
    buttons?: readonly QuickInputButton[] | undefined;

    constructor(public resource: Uri, public buttonType?: ButtonType, public buttonTip?: string) {
        this.resourceUri = resource;
        this.label = '';
        if (buttonType) {
            this.buttons = [new GitChangeButton(buttonType, buttonTip)];
        }
    }
}

interface GitChanges {
    index: GitChangeItem[];
    working: GitChangeItem[];
    untracked: GitChangeItem[];
}

export async function gitStatusOpen() {
    const uri = await showFilePicker();
    if (uri) {
        const document = await workspace.openTextDocument(uri);
        await window.showTextDocument(document);
    }
}

function getChanges(repo: Repository) : GitChanges {
    const indexChanges: GitChangeItem[] = repo.state.indexChanges
        .map((change) => {
            return new GitChangeItem(change.uri, BUTTONTYPE.REMOVE);
        });
    const workingTreeChanges: GitChangeItem[] = repo.state.workingTreeChanges
        .map((change) => {
            return new GitChangeItem(change.uri, BUTTONTYPE.PLUS);
        });
    const untrackedChanges: GitChangeItem[] = repo.state.untrackedChanges
        .map((change) => {
            return new GitChangeItem(change.uri, BUTTONTYPE.PLUS);
        });
    
    return { index: indexChanges, working: workingTreeChanges, untracked: untrackedChanges }
}

const buildChangeItems = (changes: GitChanges) : (GitChangeItem | GitSeparator)[] => [
    new GitSeparator('Index'),
    ...changes.index,
    new GitSeparator('Working'),
    ...changes.working,
    new GitSeparator('Untracked'),
    ...changes.untracked
]

async function showFilePicker() {
    const gitExtension = extensions.getExtension<GitExtension>('vscode.git')?.exports;
    if (!gitExtension) {
        return;
    }

    const git = gitExtension.getAPI(1);

    const activeEditor = window.activeTextEditor;
    if (!activeEditor) {
        return;
    }

    const repo = git.getRepository(activeEditor.document.uri);
    if (!repo) {
        return;
    }

    const disposables: Disposable[] = [];
    try {
        return await new Promise<Uri | undefined>((resolve) => {
            const gitChanges = getChanges(repo);
            const input = window.createQuickPick<GitChangeItem | GitSeparator>();
            input.title = 'Git Status';
            input.placeholder = 'Select file';
            input.items = buildChangeItems(gitChanges);
            disposables.push(
                input.onDidChangeSelection(items => {
                    const item = items[0];
                    if (item instanceof GitChangeItem) {
                        resolve(item.resourceUri);
                        input.hide();
                    }
                }),
                input.onDidHide(() => {
                    resolve(undefined);
                    input.dispose();
                }),
                input.onDidTriggerItemButton(async (item) => {
                    const value: GitChangeItem | GitSeparator = item.item;
                    if (value instanceof GitSeparator) {
                        return;
                    }

                    if (value.buttonType === BUTTONTYPE.PLUS) {
                        // stage
                        await repo.add([value.resource.fsPath]);
                        input.items = buildChangeItems(getChanges(repo));
                    }
                    else if (value.buttonType === BUTTONTYPE.REMOVE) {
                        // unstage
                        await repo.revert([value.resource.fsPath])
                        input.items = buildChangeItems(getChanges(repo));
                    }
                })
            );
            input.show();
        });
    } finally {
        disposables.forEach(d => d.dispose());
    }
    
    
}