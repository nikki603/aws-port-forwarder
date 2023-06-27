import * as vscode from 'vscode';
import { SessionTreeProvider } from './SessionTreeProvider';

const pollingIntervalMs = 60 * 1000; // One minute
const eventListenerTries = 3; // The event listener will try at most 3 times to connect for events
const eventListenerLifetimeSeconds = 60 * 5; // Five minutes
const debounceDelayMs = 500; // Refreshes rapidly initiated for the same tree view will be debounced to occur 500ms after the last initiation

// type RefreshReason = 'interval' | 'event' | 'config' | 'manual' | 'contextChange';
// const SessionEventActions: EventAction[] = ['create', 'terminate'];

export class RefreshManager extends vscode.Disposable {
    private readonly autoRefreshDisposables: vscode.Disposable[] = [];
    private readonly viewOpenedDisposables: vscode.Disposable[] = [];
    private readonly cts: vscode.CancellationTokenSource = new vscode.CancellationTokenSource();
    private autoRefreshSetup: boolean = false;

    public constructor() {
        super(() => vscode.Disposable.from(...this.autoRefreshDisposables, ...this.viewOpenedDisposables).dispose());
        // const treeViewsToInitiateAutoRefresh = [
        //     ext.sessionsTreeView
        // ];
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
        // this.setupRefreshOnRuntimeEvent();
        // this.setupRefreshOnConfigurationChange();
        // this.setupRefreshOnDockerConfigurationChange();
        // this.setupRefreshOnContextChange();
    }

    private setupRefreshOnInterval(): void {
        const timer = setInterval(async () => {
            console.log("session list refresh");
            //SessionTreeProvider.refresh();
            // for (const view of AllTreePrefixes) {
                
            //     await this.refresh(view, 'interval');
            // }
        }, pollingIntervalMs);

        this.autoRefreshDisposables.push(new vscode.Disposable(
            () => clearInterval(timer)
        ));
    }
}