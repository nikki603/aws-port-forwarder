import * as vscode from "vscode";
import { listEC2Instances } from "./ec2";
import { listProfiles } from './listProfiles';
import { EC2Instance } from "./models/ec2Instance.model";
import { Profile } from "./models/profile.model";
import { profilesKey } from './constants';

export class InstanceTreeProvider implements vscode.TreeDataProvider<EC2Instance> {
    readonly eventEmitter = new vscode.EventEmitter<string | undefined>();
    context: vscode.ExtensionContext;

    defaultProfile = new Profile();
      
    constructor(context: vscode.ExtensionContext) {
      this.context = context;
      this.defaultProfile.name = 'default';
      this.defaultProfile.region = 'us-east-1';
      this.context.globalState.update(profilesKey, this.defaultProfile);
    }

    private _onDidChangeTreeData: vscode.EventEmitter<EC2Instance | undefined> = new vscode.EventEmitter<EC2Instance | undefined>();
    readonly onDidChangeTreeData: vscode.Event<EC2Instance | undefined> = this._onDidChangeTreeData.event;

    refresh(): void {
      this._onDidChangeTreeData.fire(undefined);
    }

    async configureProfile(): Promise<void> {
      const profileConfigured: Profile | undefined = this.context.globalState.get(profilesKey);
      
      const profileNames = await listProfiles();
      const selectedProfile = await vscode.window.showQuickPick(profileNames, {
        title: "Select an AWS profile",
      });

      const profile = new Profile();
      profile.name = selectedProfile || profileConfigured?.name || '';
      profile.region = profileConfigured?.region || '';

      if (profile) {
        this.context.globalState.update(profilesKey, profile);
        this.refresh();
      }
    }

    getTreeItem(element: EC2Instance): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }
    getChildren(element?: EC2Instance | undefined): vscode.ProviderResult<EC2Instance[]> {
        if (element) {
            return Promise.resolve([]);
          } else {
            const selectedProfile: Profile | undefined = this.context.globalState.get(profilesKey);
            
            return listEC2Instances(selectedProfile || this.defaultProfile);
          }
    }
    getParent?(element: EC2Instance): vscode.ProviderResult<EC2Instance> {
        throw new Error("Method not implemented.");
    }
    resolveTreeItem?(item: vscode.TreeItem, element: EC2Instance, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
        throw new Error("Method not implemented.");
    }
}