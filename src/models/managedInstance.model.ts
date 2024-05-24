import * as vscode from "vscode";
import { InstanceBase } from "./instanceBase.model";

export class ManagedInstance extends InstanceBase {
  constructor(
    public readonly label: string,
    public readonly status: string,
    public readonly instanceId: string,
    public readonly platform: string,
    public readonly ipv4: string,
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
    tooltip.appendMarkdown(`* IP Address: ${this.ipv4}\n`);
    return tooltip;
  }
}
