import * as vscode from "vscode";
import { InstanceBase } from "./instanceBase.model";

export class EC2Instance extends InstanceBase {
  constructor(
    public readonly label: string,
    public readonly status: string,
    public readonly instanceId: string,
    public readonly platform: string,
    public readonly privateIpv4: string,
    public readonly publicIpv4: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, status, instanceId, platform, collapsibleState);

    const hoverMessage = this.updateTooltip(this.tooltip);
    this.tooltip = hoverMessage.value;
  }

  private updateTooltip(tooltip: string | vscode.MarkdownString | undefined) {
    if (!tooltip) {
      tooltip = new vscode.MarkdownString();
    }
    else if (typeof tooltip === 'string') {
      tooltip = new vscode.MarkdownString(tooltip);
    }
    tooltip.appendMarkdown(`* Private IP Address: ${this.privateIpv4}\n`);
    if (this.publicIpv4) {
      tooltip.appendMarkdown(`* Public IP Address: ${this.publicIpv4}\n`);
    }
    return tooltip;
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
