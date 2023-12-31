import * as vscode from "vscode";
import { Profile } from './profile.model';


export class Session extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly sessionId: string,
    public readonly status: string,
    public readonly target: string,
    public readonly startDate: Date,
    public readonly documentName: string,
    public readonly reason: string,
    public readonly profile: string,
    public readonly region: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.description = status;
    this.contextValue = 'session';
    if (this.status === 'Connected') {
      this.iconPath = new vscode.ThemeIcon('vm-active');
    } else {
      this.iconPath = new vscode.ThemeIcon('vm-connect');
    }
    

    const hoverMessage = this.generateTooltip();
    this.tooltip = hoverMessage.value;
  }

  private generateTooltip() {
    const hoverMessage = new vscode.MarkdownString();
    hoverMessage.isTrusted = true;
    hoverMessage.appendMarkdown(`* SessionId: ${this.sessionId}\n`);
    hoverMessage.appendMarkdown(`* Target: ${this.target}\n`);
    hoverMessage.appendMarkdown(`* Start Date: ${this.startDate.toString()}\n`);
    hoverMessage.appendMarkdown(`* Document Name: ${this.documentName}\n`);
    hoverMessage.appendMarkdown(`* Region: ${this.region}\n`);
    return hoverMessage;
  }
}
