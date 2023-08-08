import * as vscode from "vscode";
import { listProfiles, isValidProfile } from './listProfiles';
import { Profile, ProfileItem } from "./models/profile.model";
import { ProfileStorage } from "./ProfileStorage";

export class ProfileCommandProvider {

    constructor(private readonly storage: ProfileStorage) { }

    public async configureProfile(): Promise<void> {
        const profileNames = await listProfiles();

        const itemsPromises = profileNames.map(async profileName => {
            const status =  await isValidProfile(profileName);
            let profileStatus = '';
            if (!status){
                profileStatus = 'Invalid or expired credentials';
            }

            return new ProfileItem(profileName, profileStatus);
        });
        const items = await Promise.all(itemsPromises);
        const selectedProfile = await vscode.window.showQuickPick(items, {
            title: "Select an AWS profile",
        });

        if (selectedProfile) {
            const profile = new Profile();
            profile.name = selectedProfile.label || '';

            this.storage.setCurrentProfileId(profile.name);
        }
    }
}