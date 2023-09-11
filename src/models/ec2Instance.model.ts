import * as vscode from "vscode";

export class EC2Instance extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly status: string,
    public readonly instanceId: string,
    public readonly platform: string,
    public readonly privateIpv4: string,
    public readonly publicIpv4: string,
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

    const hoverMessage = this.generateTooltip();
    this.tooltip = hoverMessage.value;
  }

  private generateTooltip() {
    const hoverMessage = new vscode.MarkdownString();
    hoverMessage.isTrusted = true;
    hoverMessage.appendMarkdown(`* InstanceId: ${this.instanceId}\n`);
    hoverMessage.appendMarkdown(`* Platform: ${this.platform}\n`);
    hoverMessage.appendMarkdown(`* Private IP Address: ${this.privateIpv4}\n`);
    if (this.publicIpv4) {
      hoverMessage.appendMarkdown(`* Public IP Address: ${this.publicIpv4}\n`);
    }
    return hoverMessage;
  }
}

export class EC2InstanceTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly status?: string,
    public readonly iconName?: string,
    public readonly iconColor?: string
  ) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.description = status;
    if (iconName) {
      this.iconPath = new vscode.ThemeIcon(iconName, new vscode.ThemeColor(iconColor || ''));
    }
  }
}
