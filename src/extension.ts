import * as vscode from 'vscode';
import { InstanceTreeProvider } from "./InstanceTreeProvider";
import { EC2Instance } from "./models/ec2Instance.model";
import { SessionTreeProvider } from "./SessionTreeProvider";
import { Session } from './models/session.model';
import { RefreshManager } from './RefreshManager';
import { ProfileStorage } from './ProfileStorage';
import { ProfileCommandProvider } from './ProfileCommandProvider';
import { RegionCommandProvider } from './RegionCommandProvider';
import { RegionStorage } from './RegionStorage';

export async function activate(context: vscode.ExtensionContext) {
	var profileStore = new ProfileStorage(context.globalState);
	var regionStore = new RegionStorage(context.globalState);
	
	// Register providers
	const ec2InstanceListViewProvider = new InstanceTreeProvider(profileStore, regionStore);
	vscode.window.registerTreeDataProvider('apf.instance-list', ec2InstanceListViewProvider);

	// Register the refresh manager
	var refreshManager = new RefreshManager();
    context.subscriptions.push(refreshManager);

	const sessionListViewProvider = new SessionTreeProvider(profileStore, regionStore, refreshManager);
	vscode.window.registerTreeDataProvider('apf.session-list', sessionListViewProvider);

	// Register commands
	const profileCommandProvider = new ProfileCommandProvider(profileStore);
	vscode.commands.registerCommand('apf.ec2-instances.configureProfile', () => {
		profileCommandProvider.configureProfile();
	});

	const regionCommandProvider = new RegionCommandProvider(regionStore, profileStore);
	vscode.commands.registerCommand('apf.ec2-instances.configureRegion', () => {
		regionCommandProvider.configureRegion();
	});

	vscode.commands.registerCommand('apf.ec2-instances.refresh', () => {
		ec2InstanceListViewProvider.refresh();
	});
	vscode.commands.registerCommand('apf.session-list.refresh', (eventName) => {
		sessionListViewProvider.refresh(eventName);
	});
	vscode.commands.registerCommand('apf.connectPortForward', async (node: EC2Instance) => {
		sessionListViewProvider.startPortForwardingSession(node);
	});
	vscode.commands.registerCommand('apf.connectRemotePortForward', async (node: EC2Instance) => {
		sessionListViewProvider.startRemotePortForwardingSession(node);
	});
	vscode.commands.registerCommand('apf.terminateSession', async (node: Session) => {
		sessionListViewProvider.terminateSession(node);
	});
}

// This method is called when your extension is deactivated
export function deactivate() {}
