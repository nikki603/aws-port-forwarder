import * as vscode from "vscode";
import { listEC2Instances } from "./ec2";
import { listProfiles } from './listProfiles';
import { Profile } from "./InstanceTreeProvider";
import { listConnectedSessions } from './ssm';
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts"; 

export class Session extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly sessionId: string,
    public readonly status: string,
    public readonly profile: Profile,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(label, collapsibleState);
    this.description = status;
  }
}

const profilesKey = 'apf.profiles';

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

    refresh(): void {
      this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: Session): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }
    getChildren(element?: Session | undefined): vscode.ProviderResult<Session[]> {
        if (element) {
            return Promise.resolve([]);
          } else {
            const selectedProfile: Profile | undefined = this.context.globalState.get(profilesKey);
            return listConnectedSessions(selectedProfile, this.context);
          }
    }
    getParent?(element: Session): vscode.ProviderResult<Session> {
        throw new Error("Method not implemented.");
    }
    resolveTreeItem?(item: vscode.TreeItem, element: Session, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
        throw new Error("Method not implemented.");
    }
}