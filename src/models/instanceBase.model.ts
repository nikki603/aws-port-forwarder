import * as vscode from "vscode";

export class InstanceBase extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly status: string,
    public readonly instanceId: string,
    public readonly platform: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.description = status.toLowerCase();
    if (platform.toLowerCase() === 'windows') {
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
    return hoverMessage;
  }
}
