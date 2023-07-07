import * as vscode from "vscode";
import { EC2Instance } from './models/ec2Instance.model';
import { listConnectedSessions } from './ssm';
import { Session } from "./models/session.model";
import { startPortForwardingSession, startRemotePortForwardingSession, terminateSession } from './ssm';
import { ProfileStorage } from "./ProfileStorage";
import { RegionStorage } from "./RegionStorage";
import { RefreshManager } from "./RefreshManager";

export class SessionTreeProvider implements vscode.TreeDataProvider<Session>, vscode.Disposable {
  readonly eventEmitter = new vscode.EventEmitter<string | undefined>();
  sessions: Session[];
  private disposables: vscode.Disposable[] = [];

  constructor(private readonly profileStore: ProfileStorage, private readonly regionStore: RegionStorage, private readonly refreshManager: RefreshManager) {
    this.sessions = new Array<Session>();
    this.disposables.push(
      this.regionStore.onSelectionChanged(this.refresh, this),
      this.profileStore.onSelectionChanged(this.refresh, this),
      this.refreshManager.onTimedEvent(this.refresh, this)
    );
  }

  private _onDidChangeTreeData: vscode.EventEmitter<Session | undefined> = new vscode.EventEmitter<Session | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Session | undefined> = this._onDidChangeTreeData.event;

  public refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  public async startPortForwardingSession(target: EC2Instance): Promise<void> {
    const localPort = await vscode.window.showInputBox({
      prompt: 'Enter local host port',
      placeHolder: '22',
      validateInput: this.validatePort
    });

    const remotePort = await vscode.window.showInputBox({
      prompt: 'Enter remote host port',
      placeHolder: '22',
      validateInput: this.validatePort
    });

    if (!localPort || !remotePort) {
      throw new Error('invalid ports');
    }

    const currentProfile = this.profileStore.getCurrentProfileId();
    const currentRegion = this.regionStore.getCurrentRegion();

    if (currentProfile && currentRegion) {
      await startPortForwardingSession(currentProfile, currentRegion, target, localPort, remotePort);
      this.refresh();
    }
  }

  public async startRemotePortForwardingSession(target: EC2Instance): Promise<void> {
    const localPort = await vscode.window.showInputBox({
      prompt: 'Enter local host port',
      placeHolder: '22',
      validateInput: this.validatePort
    });

    const remoteHost = await vscode.window.showInputBox({
      prompt: 'Enter remote host'
    });
    if (!remoteHost) {
      throw new Error('remoteHost invalid');
    }

    const remotePort = await vscode.window.showInputBox({
      prompt: 'Enter remote host port',
      placeHolder: '22',
      validateInput: this.validatePort
    });

    if (!localPort || !remotePort) {
      throw new Error('invalid ports');
    }

    const currentProfile = this.profileStore.getCurrentProfileId();
    const currentRegion = this.regionStore.getCurrentRegion();
    if (currentProfile && currentRegion) {
      await startRemotePortForwardingSession(currentProfile, currentRegion, target, localPort, remotePort, remoteHost);
      this.refresh();
    }
  }

  public async terminateSession(session: Session): Promise<void> {
    const currentProfile = this.profileStore.getCurrentProfileId();
    const currentRegion = this.regionStore.getCurrentRegion();
    if (currentProfile && currentRegion) {
      await terminateSession(currentProfile, currentRegion, session.sessionId);
      this.refresh();
    }
  }

  getTreeItem(element: Session): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }
  getChildren(element?: Session | undefined): vscode.ProviderResult<Session[]> {
    if (element) {
      return Promise.resolve([]);
    } else {
      const currentProfile = this.profileStore.getCurrentProfileId();
      const currentRegion = this.regionStore.getCurrentRegion();

      if (currentProfile && currentRegion) {
        return listConnectedSessions(currentProfile, currentRegion);
      }
    }
  }
  getParent?(element: Session): vscode.ProviderResult<Session> {
    throw new Error("Method not implemented.");
  }
  resolveTreeItem?(item: vscode.TreeItem, element: Session, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
    throw new Error("Method not implemented.");
  }

  private validatePort(port: string): string {
    return !port || isNaN(parseFloat(port)) ?
      'Not a valid port number' :
      '';
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
}