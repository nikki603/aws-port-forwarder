import * as vscode from "vscode";


export class EC2Instance extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly status: string,
    public readonly instanceId: string,
    public readonly platform: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.description = status;
    if (platform === 'windows') {
      this.iconPath = new vscode.ThemeIcon('window');
      this.contextValue = 'instance.windows';
    } else {
      this.iconPath = new vscode.ThemeIcon('device-desktop');
      this.contextValue = 'instance';
    }

  }
}
