import * as vscode from "vscode";
import { RegionStorage } from "./RegionStorage";
import { ProfileStorage } from "./ProfileStorage";

export class RegionCommandProvider {

  constructor(private readonly storage: RegionStorage, private readonly profileStorage: ProfileStorage) { }

  public async configureRegion(): Promise<void> {
    try {
      const currentProfile = this.profileStorage.getCurrentProfileId();
      if (currentProfile) {
        const regionNames = await this.storage.getRegions(currentProfile);
        const selectedRegion = await vscode.window.showQuickPick(regionNames, {
          title: "Select an AWS region",
        });

        if (selectedRegion) {
          this.storage.setCurrentRegion(selectedRegion);
        }
      } else {
        vscode.window.showErrorMessage('Select valid profile first.');
      }
    } catch (err) {
      console.error(JSON.stringify(err));
      vscode.window.showErrorMessage('Select valid profile first.');
    }
  }
}