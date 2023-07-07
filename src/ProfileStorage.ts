import * as vscode from "vscode";
import { Profile } from "./models/profile.model";

const profilesKey = 'apf.profiles';
const currentProfilesKey = 'apf.currentProfileId';

export class ProfileStorage {
    private emitter: vscode.EventEmitter<string> = new vscode.EventEmitter<string>();
    public readonly onSelectionChanged: vscode.Event<string> = this.emitter.event;

    public constructor(private readonly memento: vscode.Memento) {}

    public getProfile(id: string) {
        return this.getData()[id];
    }

    public listProfiles(): [id: string, profile: Profile][] {
        return Object.entries(this.getData());
    }

    public async addProfile(id: string, profile: Profile): Promise<Profile> {
        return this.putProfile(id, profile);
    }

    public getCurrentProfileId(): string | undefined {
        return this.memento.get<string>(currentProfilesKey);
    }

    public async setCurrentProfileId(id: string | undefined): Promise<void> {
        await this.memento.update(currentProfilesKey, id);
        this.emitter.fire('profile_update');
    }

    private getData() {
        return this.memento.get<{ readonly [id: string]: Profile }>(profilesKey, {});
    }

    private async updateData(state: { readonly [id: string]: Profile | undefined }) {
        await this.memento.update(profilesKey, state);
    }

    private async putProfile(id: string, profile: Profile) {
        await this.updateData({ ...this.getData(), [id]: profile });

        return profile;
    }
}