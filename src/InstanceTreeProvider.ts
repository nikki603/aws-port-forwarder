import * as vscode from "vscode";
import { listEC2Instances } from "./ec2";
import { EC2Instance } from "./models/ec2Instance.model";
import { ProfileStorage } from "./ProfileStorage";
import { RegionStorage } from "./RegionStorage";

export class InstanceTreeProvider implements vscode.TreeDataProvider<EC2Instance>, vscode.Disposable {
    readonly eventEmitter = new vscode.EventEmitter<string | undefined>();
    private disposables: vscode.Disposable[] = [];
      
    constructor(private readonly profileStore: ProfileStorage, private readonly regionStore: RegionStorage) {
      this.disposables.push(
        this.regionStore.onSelectionChanged(this.refresh, this),
        this.profileStore.onSelectionChanged(this.refresh, this)
      );
    }

    private _onDidChangeTreeData: vscode.EventEmitter<EC2Instance | undefined> = new vscode.EventEmitter<EC2Instance | undefined>();
    readonly onDidChangeTreeData: vscode.Event<EC2Instance | undefined> = this._onDidChangeTreeData.event;

    refresh(): void {
      this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: EC2Instance): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }
    getChildren(element?: EC2Instance | undefined): vscode.ProviderResult<EC2Instance[]> {
        if (element) {
            return Promise.resolve([]);
          } else {
            const currentProfile = this.profileStore.getCurrentProfileId();
            const currentRegion = this.regionStore.getCurrentRegion();
            
            if (currentProfile && currentRegion) {
              return listEC2Instances(currentProfile, currentRegion);
            }
          }
    }
    getParent?(element: EC2Instance): vscode.ProviderResult<EC2Instance> {
        throw new Error("Method not implemented.");
    }
    resolveTreeItem?(item: vscode.TreeItem, element: EC2Instance, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
        throw new Error("Method not implemented.");
    }

    dispose() {
      this.disposables.forEach((d) => d.dispose());
    }
}