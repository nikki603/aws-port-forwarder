import * as vscode from "vscode";
import { listEC2Instances } from "./ec2";
import { listManagedInstances } from "./ssm";
import { EC2Instance, EC2InstanceTreeItem } from "./models/ec2Instance.model";
import { ProfileStorage } from "./ProfileStorage";
import { RegionStorage } from "./RegionStorage";
import { isValidProfile } from "./listProfiles";
import { ManagedInstance } from "./models/managedInstance.model";

const errorIcon = 'error';
const validIcon = 'pass-filled';

export class InstanceTreeProvider implements vscode.TreeDataProvider<EC2Instance | EC2InstanceTreeItem>, vscode.Disposable {
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
    getChildren(element?: EC2Instance | undefined): vscode.ProviderResult<(EC2Instance | EC2InstanceTreeItem)[]> {
      if (element) {
        return Promise.resolve([]);
      } else {
        const currentProfile = this.profileStore.getCurrentProfileId();
        const currentRegion = this.regionStore.getCurrentRegion();
        
        if (currentProfile && currentRegion) {
          return this.getInstanceTree(currentProfile, currentRegion);
        }
      }
    }

    private async getInstanceTree(profile: string, region: string): Promise<EC2Instance[] | ManagedInstance[] | EC2InstanceTreeItem[]> {
        const instancesTree = new Array<(EC2Instance | ManagedInstance | EC2InstanceTreeItem)>;
        const isProfileValid = await isValidProfile(profile);
        this.addProfileTreeItem(instancesTree, isProfileValid, profile, region);

        if (isProfileValid) {
          const instancesTask = listEC2Instances(profile, region);
          const managedInstancesTask = listManagedInstances(profile, region);

          const [ instances, managedInstances ] = await Promise.all([instancesTask, managedInstancesTask]);
          
          instancesTree.push(...instances);
          instancesTree.push(...managedInstances);
          if (instances.length === 0 && managedInstances.length === 0) {
            instancesTree.push(new EC2InstanceTreeItem(`No running instances found in region ${region}`));
          }
        }
        
        return instancesTree;
    }

    private addProfileTreeItem(instancesTree: (EC2Instance | EC2InstanceTreeItem)[], isProfileValid: boolean, profile: string, region: string) {
        let profileStatus = '';
        if (!isProfileValid) {
          profileStatus += 'Invalid or expired credentials';
        }

        const icon = isProfileValid ? validIcon : errorIcon;
        const iconColor = isProfileValid ? '#008000' : '#FF0000';
        instancesTree.push(new EC2InstanceTreeItem(`Profile: ${profile}, region: ${region}`, profileStatus, icon, iconColor));
        instancesTree.push(new EC2InstanceTreeItem(''));
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