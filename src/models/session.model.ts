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
    public readonly profile: Profile,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.description = status;
    this.contextValue = 'session';

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
    return hoverMessage;
  }
}
