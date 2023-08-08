import * as vscode from "vscode";

export class Profile {
    name: string = '';
  }

export class ProfileItem implements vscode.QuickPickItem {
  constructor(
    public readonly label: string,
    public readonly description: string
  ) {
    this.label = label;
    this.description = description;
  }
}
  