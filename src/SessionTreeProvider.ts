import * as vscode from "vscode";
import { Profile } from "./models/profile.model";
import { EC2Instance } from './models/ec2Instance.model';
import { listConnectedSessions } from './ssm';
import { Session } from "./models/session.model";
import { profilesKey } from './constants';
import { startPortForwardingSession, startRemotePortForwardingSession, terminateSession } from './ssm';

export class SessionTreeProvider implements vscode.TreeDataProvider<Session> {
  readonly eventEmitter = new vscode.EventEmitter<string | undefined>();
  context: vscode.ExtensionContext;
  sessions: Session[];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.sessions = new Array<Session>();
  }

  private _onDidChangeTreeData: vscode.EventEmitter<Session | undefined> = new vscode.EventEmitter<Session | undefined>();
  readonly onDidChangeTreeData: vscode.Event<Session | undefined> = this._onDidChangeTreeData.event;

  public refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  public async startPortForwardingSession(context: vscode.ExtensionContext, target: EC2Instance): Promise<void> {
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

    await startPortForwardingSession(context, target, localPort, remotePort);
    this.refresh();
  }

  public async startRemotePortForwardingSession(context: vscode.ExtensionContext, target: EC2Instance): Promise<void> {
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

    await startRemotePortForwardingSession(context, target, localPort, remotePort, remoteHost);
    this.refresh();
  }

  public async terminateSession(context: vscode.ExtensionContext, session: Session): Promise<void> {
    await terminateSession(context, session.sessionId);
    this.refresh();
  }

  getTreeItem(element: Session): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }
  getChildren(element?: Session | undefined): vscode.ProviderResult<Session[]> {
    if (element) {
      return Promise.resolve([]);
    } else {
      const selectedProfile: Profile | undefined = this.context.globalState.get(profilesKey);
      return listConnectedSessions(selectedProfile || new Profile());
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
}