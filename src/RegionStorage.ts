import * as vscode from "vscode";
import { getRegions } from "./ec2";

const regionsKey = 'apf.regions';
const currentRegionsKey = 'apf.currentRegion';

export class RegionStorage {
    private emitter: vscode.EventEmitter<string> = new vscode.EventEmitter<string>();
    public readonly onSelectionChanged: vscode.Event<string> = this.emitter.event;

    public constructor(private readonly memento: vscode.Memento) { }

    public getCurrentRegion(): string | undefined {
        return this.memento.get<string>(currentRegionsKey);
    }

    public async setCurrentRegion(id: string | undefined): Promise<void> {
        await this.memento.update(currentRegionsKey, id);
        this.emitter.fire('region_update');
    }

    public async getRegions(profile: string): Promise<string[]> {
        let storedRegions = this.memento.get<string[]>(regionsKey, []);

        if (!storedRegions || storedRegions.length === 0) {
            storedRegions = await getRegions(profile);
            this.updateData(storedRegions);
        }

        return storedRegions;
    }

    private async updateData(regions: string[]) {
        await this.memento.update(regionsKey, regions);
    }
}