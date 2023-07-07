import * as vscode from 'vscode';

const pollingIntervalMs = 60 * 1000; // One minute

export class RefreshManager extends vscode.Disposable {
    private readonly autoRefreshDisposables: vscode.Disposable[] = [];
    private readonly cts: vscode.CancellationTokenSource = new vscode.CancellationTokenSource();
    private autoRefreshSetup: boolean = false;
    private emitter: vscode.EventEmitter<string> = new vscode.EventEmitter<string>();
    public readonly onTimedEvent: vscode.Event<string> = this.emitter.event;

    public constructor() {
        super(() => vscode.Disposable.from(...this.autoRefreshDisposables).dispose());
        this.setupAutoRefreshes();
    }

    private setupAutoRefreshes(): void {
        if (this.autoRefreshSetup) {
            return;
        }
        this.autoRefreshSetup = true;

        // VSCode does *not* cancel by default on disposal of a CancellationTokenSource, so we need to manually cancel
        this.autoRefreshDisposables.unshift(new vscode.Disposable(() => this.cts.cancel()));

        this.setupRefreshOnInterval();
    }

    private setupRefreshOnInterval(): void {
        const timer = setInterval(async () => {
            console.log("session list refresh");
            this.emitter.fire('auto_session_list_update');
        }, pollingIntervalMs);

        this.autoRefreshDisposables.push(new vscode.Disposable(
            () => clearInterval(timer)
        ));
    }
}