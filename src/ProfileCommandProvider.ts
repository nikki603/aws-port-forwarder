import * as vscode from "vscode";
import { listProfiles } from './listProfiles';
import { Profile } from "./models/profile.model";
import { ProfileStorage } from "./ProfileStorage";

export class ProfileCommandProvider {

    constructor(private readonly storage: ProfileStorage) { }

    public async configureProfile(): Promise<void> {
        const profileNames = await listProfiles();
        const selectedProfile = await vscode.window.showQuickPick(profileNames, {
            title: "Select an AWS profile",
        });

        if (selectedProfile) {
            const profile = new Profile();
            profile.name = selectedProfile || '';

            this.storage.setCurrentProfileId(profile.name);
        }
    }
}